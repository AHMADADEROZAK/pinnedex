"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send, Loader2, MessageCircle } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { comment } from "@/features/community/actions/community"

interface CommentData {
  _id: string
  content: string
  userName: string
  userEmail: string
  createdAt: string
}

const formSchema = z.object({
  content: z.string().min(1).max(280),
})

type FormValues = z.infer<typeof formSchema>

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function CommentSection({ postId, expanded = false }: { postId: string; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded)
  const [comments, setComments] = useState<CommentData[]>([])
  const [commentsReady, setCommentsReady] = useState(false)
  const [pending, setPending] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  })

  const loading = open && !commentsReady

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`)
      const data = await res.json()
      setComments(data)
    } catch {
      // ignore network errors
    } finally {
      setCommentsReady(true)
    }
  }, [postId])

  useEffect(() => {
    if (expanded) {
      void Promise.resolve().then(fetchComments)
    }
  }, [expanded, fetchComments])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && comments.length === 0) {
      fetchComments()
    }
  }

  const onSubmit = async (values: FormValues) => {
    setPending(true)
    const fd = new FormData()
    fd.set("content", values.content)
    fd.set("postId", postId)
    await comment(undefined, fd)
    form.reset()
    setPending(false)
    fetchComments()
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-2">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <MessageCircle className="size-3.5" />
        {comments.length > 0 ? `${comments.length} comments` : "Comment"}
      </button>

      {open && (
        <div className="flex flex-col gap-2">
          {loading && (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {comments.map((c) => (
            <div key={c._id} className="flex gap-2">
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback>{initials(c.userName)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium">{c.userName}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-xs leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-center gap-2"
          >
            <Input
              {...form.register("content")}
              placeholder="Write a comment..."
              className="h-8 flex-1 text-xs"
            />
            <Button type="submit" size="sm" disabled={pending} className="h-8">
              {pending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
