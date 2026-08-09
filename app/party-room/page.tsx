"use client"

import * as React from "react"
import { ArrowLeft, PartyPopper, X } from "lucide-react"
import Link from "next/link"

import type { OnlineMember } from "@/features/chat/components/PartyRoom"
import { OnlineMembers } from "@/features/chat/components/OnlineMembers"
import { PartyForm } from "@/features/chat/components/PartyForm"
import { PartyRoom } from "@/features/chat/components/PartyRoom"

type JoinedInfo = {
  memberId: string
  name: string
}

const STORAGE_KEY = "pine-party.party.member"

export default function PartyRoomPage() {
  const [member, setMember] = React.useState<JoinedInfo | null>(null)
  const [online, setOnline] = React.useState<OnlineMember[]>([])
  const [showJoin, setShowJoin] = React.useState(false)

  React.useEffect(() => {
    let active = true

    const restore = () => {
      if (!active) return

      let stored: JoinedInfo | null = null
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        stored = raw ? (JSON.parse(raw) as JoinedInfo) : null
      } catch {
        stored = null
      }

      if (!stored) return

      fetch(`/api/telegram/party/member?memberId=${encodeURIComponent(stored.memberId)}`)
        .then(async (res) => {
          if (!active) return
          if (!res.ok) {
            window.localStorage.removeItem(STORAGE_KEY)
            setMember(null)
            return
          }
          const data = await res.json()
          const info = { memberId: data.memberId, name: data.name }
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
          setMember(info)
        })
        .catch(() => {
          // keep whatever is stored; room will reconnect itself
        })
    }

    const timer = window.setTimeout(restore, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  function handleJoined(info: JoinedInfo) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
    setMember(info)
    setShowJoin(false)
  }

  function handleLeave() {
    window.localStorage.removeItem(STORAGE_KEY)
    setMember(null)
    setShowJoin(false)
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-x-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="absolute top-1/4 -left-24 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>
      </div>

      <div className="relative z-10 grid w-full max-w-5xl items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            <PartyPopper className="size-3.5" />
            Pine Room Party
          </span>

          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-5xl">
            The room is live
          </h1>

          <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
            {member
              ? "You're in. Say hi and grab your spot before the room fills up."
              : "Get your ticket straight into the room."}
          </p>

          <OnlineMembers
            members={online}
            className="mt-8 w-full"
          />
        </div>

        <div className="w-full">
          <PartyRoom
            memberId={member?.memberId}
            name={member?.name}
            onLeave={member ? handleLeave : undefined}
            onJoin={() => setShowJoin(true)}
            onPresence={setOnline}
          />

          {showJoin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-sm rounded-xl border bg-card p-4 shadow-xl sm:p-5">
                <button
                  type="button"
                  onClick={() => setShowJoin(false)}
                  aria-label="Close"
                  className="absolute top-3 right-3 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
                <PartyForm onJoined={handleJoined} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}