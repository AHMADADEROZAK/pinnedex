"use client"

import * as React from "react"
import { Users } from "lucide-react"

import type { OnlineMember } from "@/features/chat/components/PartyRoom"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : ""
  return (first + last).toUpperCase()
}

export function OnlineMembers({
  members,
  className,
  hint,
}: {
  members: OnlineMember[]
  className?: string
  hint?: string
}) {
  return (
    <div
      className={cn(
        "w-full rounded-xl border bg-card p-4 shadow-xs",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Users className="size-3.5" data-icon="inline-start" />
          Online now
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {hint ?? "No one is online right now."}
        </p>
      ) : (
        <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
          {members.map((m) => (
            <li key={m.memberId}>
              <div className="flex items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/60">
                <Avatar size="sm" className="border border-border">
                  <AvatarFallback>{initials(m.name)}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {m.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    #{m.memberId}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}