"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Heart, Eye } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CommentDialog } from "@/features/community/components/CommentDialog"
import { toggleLike } from "@/features/community/actions/community"
import { cn } from "@/lib/utils"

export interface PostData {
  _id: string
  content: string
  images: { key: string; url: string }[]
  userName: string
  userEmail: string
  txSignature: string
  createdAt: string
  explorerTxUrl: string
  likesCount: number
  likedByMe: boolean
  commentCount: number
}

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
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function PostCard({ post }: { post: PostData }) {
  const router = useRouter()
  const [liked, setLiked] = useState(post.likedByMe)
  const [likesCount, setLikesCount] = useState(post.likesCount)

  const handleLike = async () => {
    const prev = liked
    setLiked(!prev)
    setLikesCount((c) => c + (prev ? -1 : 1))
    await toggleLike(post._id)
  }

  return (
    <div className="flex gap-3 rounded-md border bg-card p-4">
      <Avatar size="default" className="shrink-0">
        <AvatarFallback>{initials(post.userName)}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{post.userName}</span>
          <span className="text-xs text-muted-foreground">@{post.userEmail.split("@")[0]}</span>
          <span className="text-xs text-muted-foreground">· {timeAgo(post.createdAt)}</span>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

        {post.images.length > 0 && (
          <div
            className={`grid gap-1 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {post.images.map((img) => (
              <a key={img.key} href={img.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt="Post image"
                  className="max-h-80 w-full rounded-md border object-cover"
                />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-1 border-t pt-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={handleLike}
                  aria-label="Like"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted",
                    liked ? "text-red-500" : "text-muted-foreground",
                  )}
                >
                  <Heart className={cn("size-4", liked && "fill-current")} />
                  {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
                </button>
              }
            />
            <TooltipContent>Like</TooltipContent>
          </Tooltip>

          <CommentDialog postId={post._id} count={post.commentCount} />

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => router.push(`/community/${post._id}`)}
                  aria-label="View"
                  className="inline-flex items-center rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Eye className="size-4" />
                </button>
              }
            />
            <TooltipContent>View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href={post.explorerTxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Scan"
                  className="inline-flex items-center rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
              }
            />
            <TooltipContent>Scan</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
