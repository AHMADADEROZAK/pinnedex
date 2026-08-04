"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send, Loader2, MessageCircle, X, MapPin, Eye } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ImageUpload } from "@/features/community/components/ImageUpload"
import { EmojiDialog } from "@/features/community/components/EmojiDialog"
import { comment } from "@/features/community/actions/community"
import { type FormState } from "@/lib/definitions"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/toast"

const MAX_LEN = 280

const formSchema = z.object({
  content: z.string().min(1).max(MAX_LEN),
})

type FormValues = z.infer<typeof formSchema>

function CharacterRing({ value, max }: { value: number; max: number }) {
  const pct = Math.min(value / max, 1)
  const remaining = max - value
  const isNearLimit = remaining <= 20
  const isOver = remaining < 0
  const radius = 9
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex items-center gap-1.5">
      {isNearLimit && (
        <span className={cn("text-[11px] tabular-nums font-medium", isOver ? "text-red-500" : "text-amber-500")}>
          {remaining}
        </span>
      )}
      <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90">
        <circle cx="11" cy="11" r={radius} fill="none" strokeWidth="2" className="stroke-border" />
        <circle
          cx="11" cy="11" r={radius} fill="none" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)}
          className={cn("transition-[stroke-dashoffset,stroke] duration-200 ease-out", isOver ? "stroke-red-500" : isNearLimit ? "stroke-amber-500" : "stroke-[#9945FF]")}
        />
      </svg>
    </div>
  )
}

export function CommentDialog({ postId, count = 0 }: { postId: string; count?: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [images, setImages] = useState<{ key: string; preview: string }[]>([])
  const [location, setLocation] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  })

  const contentValue = useWatch({ control: form.control, name: "content" }) ?? ""

  const insertEmoji = (emoji: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>("[data-comment-composer]")
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = form.getValues("content")
    const next = current.slice(0, start) + emoji + current.slice(end)
    form.setValue("content", next, { shouldValidate: true })
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.add({ title: "Geolocation not supported", type: "warning" })
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`)
          const data = await res.json()
          const name = data?.display_name?.split(",")?.slice(0, 2)?.join(", ") ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          setLocation(name)
        } catch { setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`) }
      },
      () => toast.add({ title: "Location unavailable", description: "You can type the location manually.", type: "warning" }),
    )
  }

  const resetComposer = () => {
    form.reset()
    setImages([])
    setLocation("")
    setServerError(null)
  }

  const onSubmit = async (values: FormValues) => {
    setPending(true)
    setServerError(null)

    let content = values.content
    if (location.trim()) content = `${content}\n\n📍 ${location.trim()}`

    const fd = new FormData()
    fd.set("content", content)
    fd.set("postId", postId)
    for (const img of images) fd.append("images", img.key)

    const state: FormState = await comment(undefined, fd)

    if (state?.errors) {
      for (const [key, messages] of Object.entries(state.errors)) {
        if (messages?.[0]) {
          form.setError(key as keyof FormValues, { message: messages[0] })
        }
      }
      setPending(false)
      return
    }

    if (state?.message) {
      setServerError(state.message)
      setPending(false)
      return
    }

    resetComposer()
    setPending(false)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(true)}
              aria-label="Comment"
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageCircle className="size-4" />
              {count > 0 && <span className="text-xs">{count}</span>}
            </Button>
          }
        />
        <TooltipContent>Comment</TooltipContent>
      </Tooltip>
      <AlertDialogContent size="default" className="overflow-hidden p-0 sm:max-w-md">
        <AlertDialogHeader className="space-y-0 border-b px-5 py-4 text-left">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]">
                <MessageCircle className="size-4 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-base leading-none">Add a comment</AlertDialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">Share your thoughts on this pin</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="icon-sm" onClick={() => { setOpen(false); router.push(`/community/${postId}`) }} className="shrink-0 rounded-full" title="View detail">
                <Eye className="size-3.5" />
              </Button>
              <Button type="button" variant="outline" size="icon-sm" onClick={() => { setOpen(false); resetComposer() }} className="shrink-0 rounded-full">
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        </AlertDialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <div className="flex flex-col gap-3 px-5 pt-4">
            <div className={cn("group relative rounded-xl border bg-muted/30 transition-colors", "focus-within:border-[#9945FF]/50 focus-within:bg-background", form.formState.errors.content && "border-red-400/60")}>
              <Textarea {...form.register("content")} data-comment-composer placeholder="Write a comment..." rows={3} maxLength={MAX_LEN + 40} className="resize-none border-none bg-transparent shadow-none focus-visible:ring-0" aria-invalid={!!form.formState.errors.content} />
              <div className="flex items-center justify-end px-3 pb-2">
                <CharacterRing value={contentValue.length} max={MAX_LEN} />
              </div>
            </div>

            {form.formState.errors.content && <FieldError errors={[form.formState.errors.content]} />}

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={img.key} className="group relative">
                    <img src={img.preview} alt="" className="size-20 rounded-md border object-cover" />
                    <button type="button" onClick={() => setImages((p) => p.filter((_, i) => i !== idx))} className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-0.5">
              <ImageUpload images={images} onImagesChange={(all) => setImages(all)} />
              <EmojiDialog onSelect={insertEmoji} />
              <Tooltip>
                <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-sm" onClick={requestLocation} className="rounded-full"><MapPin className="size-4" /></Button>} />
                <TooltipContent>Add location</TooltipContent>
              </Tooltip>
            </div>

            {location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /><span>{location}</span>
                <button type="button" onClick={() => setLocation("")} className="text-muted-foreground hover:text-foreground"><X className="size-3" /></button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3 border-t bg-muted/20 px-5 py-3.5">
            {serverError && <p className="mr-auto text-sm text-destructive">{serverError}</p>}
            <Button type="submit" disabled={pending} size="sm" className="gap-1.5">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
