"use client"

import * as React from "react"
import TextareaAutosize from "react-textarea-autosize"
import { AlertCircle, ArrowUp, Lock, LogOut, PartyPopper } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MessageAnimated } from "@/features/chat/components/MessageAnimated"
import { cn } from "@/lib/utils"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  InputGroupButton,
} from "@/components/ui/input-group"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"

export type ChatMessage = {
  id: string
  memberId: string
  name: string
  text: string
  createdAt: string
}

const MAX_MESSAGES = 150
const MAX_CHARS = 280

type Props = {
  memberId?: string
  name?: string
  onLeave?: () => void
  onJoin?: () => void
  onPresence?: (members: OnlineMember[]) => void
}

export type OnlineMember = {
  memberId: string
  name: string
}

function wsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws"
  return `${protocol}://${window.location.host}/ws`
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : ""
  return (first + last).toUpperCase()
}

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
        <span
          className={cn(
            "text-[11px] tabular-nums font-medium",
            isOver ? "text-red-500" : "text-amber-500"
          )}
        >
          {remaining}
        </span>
      )}
      <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90">
        <circle
          cx="11"
          cy="11"
          r={radius}
          fill="none"
          strokeWidth="2"
          className="stroke-border"
        />
        <circle
          cx="11"
          cy="11"
          r={radius}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          className={cn(
            "transition-[stroke-dashoffset,stroke] duration-200 ease-out",
            isOver
              ? "stroke-red-500"
              : isNearLimit
                ? "stroke-amber-500"
                : "stroke-primary"
          )}
        />
      </svg>
    </div>
  )
}

export function PartyRoom({ memberId, name, onLeave, onJoin, onPresence }: Props) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [text, setText] = React.useState("")
  const [total, setTotal] = React.useState(0)
  const [full, setFull] = React.useState(false)
  const [connected, setConnected] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const socketRef = React.useRef<WebSocket | null>(null)

  const isGuest = !memberId
  const disabled = full || total >= MAX_MESSAGES
  const canSend = connected && !disabled && !isGuest

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const lastSoundAtRef = React.useRef(0)

  function playNotifSound() {
    const now = Date.now()
    if (now - lastSoundAtRef.current < 1500) return
    lastSoundAtRef.current = now

    const el = audioRef.current
    if (!el) return
    el.currentTime = 0
    el.play().catch(() => {
      // autoplay blocked until first user interaction
    })
  }

  React.useEffect(() => {
    audioRef.current = new Audio("/notif-sound.wav")
    audioRef.current.preload = "auto"
    return () => {
      audioRef.current = null
    }
  }, [])

  React.useEffect(() => {
    let active = true
    const connect = () => {
      const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : ""
      const ws = new WebSocket(`${wsUrl()}${query}`)
      socketRef.current = ws

      ws.addEventListener("open", () => {
        if (!active) return
        setConnected(true)
        setError(null)
      })

      ws.addEventListener("message", (event) => {
        if (!active) return
        try {
          const data = JSON.parse(event.data as string)
          if (data.type === "message") {
            setMessages((prev) => [...prev, data.message])
            if (data.message.memberId !== memberId) {
              playNotifSound()
            }
          } else if (data.type === "history") {
            setMessages(data.messages ?? [])
            setTotal(data.total ?? data.messages?.length ?? 0)
          } else if (data.type === "presence") {
            onPresence?.(data.members ?? [])
          } else if (data.type === "count") {
            setTotal(data.total)
          } else if (data.type === "full") {
            setFull(true)
            setConnected(false)
          } else if (data.type === "error") {
            setError(data.error ?? "Something went wrong.")
            setConnected(false)
          }
        } catch {
          // ignore malformed frames
        }
      })

      ws.addEventListener("close", () => {
        if (!active) return
        setConnected(false)
        setTimeout(() => {
          if (active && !full) connect()
        }, 2000)
      })

      ws.addEventListener("error", () => {
        if (!active) return
        setError("Cannot reach the room. Trying to reconnect…")
      })
    }

    connect()
    return () => {
      active = false
      socketRef.current?.close()
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [memberId, full, onPresence])

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify({ type: "message", content: trimmed }))
    setText("")
  }

  const presaleUrl = "/presale"

  return (
    <Card className="mx-auto h-140 w-full max-w-125 gap-0 border border-primary">
      <CardHeader className="flex items-start justify-between gap-3 border-b">
        <div className="flex min-w-0 flex-col gap-1 text-left">
          <CardTitle>Party Room</CardTitle>
          <CardDescription>
            <span className="font-mono">{isGuest ? "Guest" : `${name} ${memberId}`}</span>
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
              {total}/{MAX_MESSAGES}
            </span>
          </CardDescription>
        </div>
        <CardAction className="col-start-auto row-start-auto self-start">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span
                className={cn(
                  "size-2 rounded-full",
                  connected ? "bg-emerald-500" : "bg-amber-500"
                )}
              />
              {connected ? "Live" : "Reconnecting…"}
            </span>
            {onLeave && (
              <Button
                type="button"
                variant="ghost"
                onClick={onLeave}
                aria-label="Leave the room"
                title="Leave the room"
              >
                <LogOut />
              </Button>
            )}
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {messages.length === 0 ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PartyPopper />
              </EmptyMedia>
              <EmptyTitle>No messages yet</EmptyTitle>
              <EmptyDescription>Say hi to the room!</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <MessageScrollerProvider autoScroll>
            <MessageScroller>
              <MessageScrollerViewport>
                <MessageScrollerContent className="gap-2 px-(--card-spacing)">
                  {messages.map((m) => (
                    <MessageAnimated
                      key={m.id}
                      messageId={m.id}
                      className="w-full"
                      initial={{ y: 24, opacity: 0, scale: 0.98 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <Message align={m.memberId === memberId ? "end" : "start"}>
                        <MessageAvatar>
                          <Avatar size={"default"}>
                            <AvatarFallback>{initials(m.name)}</AvatarFallback>
                          </Avatar>
                        </MessageAvatar>
                        <MessageContent>
                          <MessageHeader>
                            <span className="font-semibold text-primary">{m.name}</span>
                            <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                              #{m.memberId}
                            </span>
                          </MessageHeader>
                          <Bubble
                            variant={m.memberId === memberId ? "tinted" : "outline"}
                          >
                            <BubbleContent className="rounded-[8px] px-7 text-left">{m.text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageAnimated>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
            </MessageScroller>
          </MessageScrollerProvider>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2">
        {error && (
          <p className="flex items-center gap-1.5 text-left text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" data-icon="inline-start" />
            {error}
          </p>
        )}

        {isGuest && !disabled ? (
          <div className="flex w-full my-3 flex-col gap-3 pb-1 text-left">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" data-icon="inline-start" />
              <p className="text-sm font-medium text-foreground">
                Join the party to send messages
              </p>
            </div>
            <Button
              type="button"
              onClick={onJoin}
              disabled={!connected}
              className="w-full"
            >
              <PartyPopper data-icon="inline-start" />
              Join party
            </Button>
          </div>
        ) : disabled ? (
          <div className="flex w-full my-3 flex-col gap-3 text-left">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" data-icon="inline-start" />
              <p className="text-sm font-medium text-foreground">
                The room has reached its {MAX_MESSAGES}-chat limit
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Get presale access to keep chatting and get exclusive perks.
            </p>
            <Button
              render={<a href={presaleUrl} />}
              nativeButton={false}
            >
              Go to presale
            </Button>
          </div>
        ) : (
          <form
            className="my-3 w-full"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <div
              className={cn(
                "group relative rounded-xl border bg-muted/30 transition-colors",
                "focus-within:border-ring/50 focus-within:bg-background"
              )}
            >
              <TextareaAutosize
                data-slot="input-group-control"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type a message…"
                aria-label="Message"
                minRows={3}
                maxRows={6}
                maxLength={MAX_CHARS + 40}
                disabled={!canSend}
                className="w-full resize-none border-none bg-transparent px-3 pt-2.5 pb-1 text-sm leading-relaxed shadow-none ring-0 outline-none focus-visible:ring-0 disabled:opacity-50 dark:bg-transparent dark:placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-end gap-2 px-3 pb-2">
                <CharacterRing value={text.length} max={MAX_CHARS} />
                <InputGroupButton
                  type="submit"
                  variant="default"
                  size="icon-sm"
                  disabled={!canSend || !text.trim()}
                  aria-label="Send"
                >
                  <ArrowUp />
                  <span className="sr-only">Send</span>
                </InputGroupButton>
              </div>
            </div>
          </form>
        )}
      </CardFooter>
    </Card>
  )
}