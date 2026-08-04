import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export interface NewPin {
  _id: string
  content: string
  userName: string
  userEmail: string
  createdAt: string
}

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

export function NewPins({ pins }: { pins: NewPin[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[#9945FF]" />
        <h2 className="font-heading text-sm font-semibold">New pins</h2>
      </div>

      {pins.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Nothing pinned yet.
        </p>
      ) : (
        <ol className="mt-2 flex flex-col">
          {pins.map((pin) => (
            <li key={pin._id}>
              <Link
                href={`/community/${pin._id}`}
                className="group flex gap-3 rounded-md px-1.5 py-2.5 transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Avatar size="sm" className="size-5 shrink-0">
                      <AvatarFallback className="text-[9px]">
                        {initials(pin.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs font-medium text-foreground">
                      {pin.userName}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      @{pin.userEmail.split("@")[0]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs leading-relaxed text-foreground/90">
                    {truncateContent(pin.content)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {timeAgo(pin.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
