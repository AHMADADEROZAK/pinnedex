import Link from "next/link"
import { Flame, Heart, MessageCircle } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface PopularPin {
  _id: string
  content: string
  userName: string
  userEmail: string
  likesCount: number
  commentCount: number
}

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

const MAX_CONTENT_CHARS = 30

const truncateContent = (content: string) =>
  content.length > MAX_CONTENT_CHARS
    ? `${content.slice(0, MAX_CONTENT_CHARS).trimEnd()}…`
    : content

export function PopularPins({ pins }: { pins: PopularPin[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <Flame className="size-4 text-[#9945FF]" />
        <h2 className="font-heading text-sm font-semibold">Popular pins</h2>
      </div>

      {pins.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No popular pins yet. Like and comment to rank them.
        </p>
      ) : (
        <ol className="mt-2 flex flex-col">
          {pins.map((pin, i) => (
            <li key={pin._id}>
              <Link
                href={`/community/${pin._id}`}
                className="group flex gap-3 rounded-md px-1.5 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Avatar size="sm" className="size-5">
                      <AvatarFallback className="text-[9px]">
                        {initials(pin.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-[11px] text-muted-foreground">
                      @{pin.userEmail.split("@")[0]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs leading-relaxed text-foreground/90">
                    {truncateContent(pin.content)}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="size-3" />
                      {pin.likesCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="size-3" />
                      {pin.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
