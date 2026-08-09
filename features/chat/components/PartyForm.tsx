"use client"

import * as React from "react"
import {
  AlertCircle,
  Loader2,
  MessageCircle,
  PartyPopper as PartyPopperIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group"

type Step =
  | "idle"
  | "loading"
  | "awaiting"
  | "otp"
  | "error"

type JoinedInfo = {
  memberId: string
  name: string
}

export function PartyForm({
  className,
  onJoined,
}: {
  className?: string
  onJoined: (info: JoinedInfo) => void
}) {
  const [step, setStep] = React.useState<Step>("idle")
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [uuid, setUuid] = React.useState("")
  const [botLink, setBotLink] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [submittingOtp, setSubmittingOtp] = React.useState(false)

  React.useEffect(() => {
    if (!uuid) return
    if (step === "otp") return
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/telegram/party/challenge?uuid=${uuid}`)
        const data = await res.json()
        if (data?.status === "awaiting_otp") {
          setStep("otp")
        }
      } catch {
        // keep polling
      }
    }, 2500)
    return () => clearInterval(id)
  }, [step, uuid])

  async function handleStart() {
    setStep("loading")
    setServerError(null)

    const popup = window.open("", "_blank")

    try {
      const res = await fetch("/api/telegram/party/challenge", { method: "POST" })
      const data = await res.json()

      if (!res.ok) {
        popup?.close()
        setServerError(data.error ?? "Failed to start.")
        setStep("error")
        return
      }

      setUuid(data.uuid)
      setBotLink(data.botLink)
      setStep("awaiting")
      if (popup) {
        popup.location.href = data.botLink
      } else {
        window.location.href = data.botLink
      }
    } catch {
      popup?.close()
      setServerError("Something went wrong. Try again.")
      setStep("error")
    }
  }

  async function handleSubmitOtp() {
    if (!otp || submittingOtp) return
    setSubmittingOtp(true)
    setServerError(null)
    try {
      const res = await fetch("/api/telegram/party/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error ?? "Invalid OTP.")
        return
      }
      onJoined({ memberId: data.memberId, name: data.name })
    } catch {
      setServerError("Something went wrong. Try again.")
    } finally {
      setSubmittingOtp(false)
    }
  }

  if (step === "awaiting") {
    return (
      <div className={cn("flex w-full flex-col gap-3 text-left", className)}>
        <span className="inline-flex items-center gap-2 rounded-md border bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
          <Loader2 className="animate-spin" data-icon="inline-start" />
          Waiting for verification…
        </span>
        <p className="text-sm text-muted-foreground">
          In the opened Telegram chat, tap{" "}
          <span className="font-medium text-foreground">Get verify code</span>{" "}
          to receive your ticket code, then enter it below to enter the Pine Room.
        </p>
        <Button
          variant="outline"
          render={<a href={botLink} target="_blank" rel="noreferrer" />}
          nativeButton={false}
        >
          <MessageCircle data-icon="inline-start" />
          Open Telegram
        </Button>
        {serverError && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" data-icon="inline-start" />
            {serverError}
          </p>
        )}
      </div>
    )
  }

  if (step === "otp") {
    return (
      <div className={cn("flex w-full flex-col gap-3 text-left", className)}>
        <p className="text-sm text-muted-foreground">
          Enter your ticket code from Telegram to join the Pine Room Party.
        </p>
        <InputGroup>
          <InputGroupInput
            value={otp}
            onChange={(e) => setOtp(e.target.value.toUpperCase())}
            placeholder="Enter 6-character code"
            maxLength={6}
            aria-label="OTP"
          />
        </InputGroup>
        {serverError && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" data-icon="inline-start" />
            {serverError}
          </p>
        )}
        <Button
          type="button"
          disabled={otp.length !== 6 || submittingOtp}
          onClick={handleSubmitOtp}
        >
          {submittingOtp && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {submittingOtp ? "Verifying…" : "Enter the Room"}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      <p className="text-sm text-muted-foreground">
        Verify via Telegram, and you get your ticket straight into the Pine
        Room Party. No registration needed.
      </p>

      {step === "error" && (
        <p className="flex items-center gap-1.5 text-left text-sm text-destructive">
          <AlertCircle className="size-3.5 shrink-0" data-icon="inline-start" />
          {serverError}
        </p>
      )}

      <Button type="button" onClick={handleStart} disabled={step === "loading"}>
        {step === "loading" ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <PartyPopperIcon data-icon="inline-start" />
        )}
        {step === "loading" ? "Starting…" : "Tap to join party"}
      </Button>
    </div>
  )
}