"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Loader2, Send, PinIcon, X, Sparkles, AlertCircle, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet"
import { ImageUpload } from "@/features/community/components/ImageUpload"
import { EmojiDialog } from "@/features/community/components/EmojiDialog"
import { pinned } from "@/features/community/actions/community"
import { type FormState } from "@/lib/definitions"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const MAX_LEN = 280

const formSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(MAX_LEN, "Max 280 characters."),
})

type FormValues = z.infer<typeof formSchema>

interface PinDialogProps {
  feeSol: number
  collectionWallet: string
}

/**
 * Small circular progress ring showing how much of the character
 * budget has been used. Sits inside the composer, bottom-right —
 * replaces the plain "n/280" text with something you can read at a glance.
 */
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
            isOver ? "text-red-500" : "text-amber-500",
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
            isOver ? "stroke-red-500" : isNearLimit ? "stroke-amber-500" : "stroke-[#9945FF]",
          )}
        />
      </svg>
    </div>
  )
}

export function PinDialog({ feeSol, collectionWallet }: PinDialogProps) {
  const router = useRouter()
  const { connection } = useConnection()
  const { publicKey, connected, sendTransaction } = useWallet()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [images, setImages] = useState<{ key: string; preview: string }[]>([])
  const [location, setLocation] = useState("")
  const [showLocation, setShowLocation] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  })

  const contentValue = useWatch({ control: form.control, name: "content" }) ?? ""
  const lamports = Math.round(feeSol * LAMPORTS_PER_SOL)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) {
      form.reset()
      setImages([])
      setLocation("")
      setShowLocation(false)
      setServerError(null)
      setPending(false)
      requestLocation()
    }
  }

  const insertEmoji = (emoji: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>("[data-pin-composer]")
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const current = form.getValues("content")
    const next = current.slice(0, start) + emoji + current.slice(end)
    form.setValue("content", next, { shouldValidate: true })
    requestAnimationFrame(() => {
      textarea.focus()
      const pos = start + emoji.length
      textarea.setSelectionRange(pos, pos)
    })
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setShowLocation(true)
      toast.add({ title: "Geolocation not supported", description: "Your browser does not support geolocation.", type: "warning" })
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
          )
          const data = await res.json()
          const name = data?.display_name?.split(",")?.slice(0, 2)?.join(", ") ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          setLocation(name)
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
      },
      () => {
        setShowLocation(true)
      },
    )
  }

  const onSubmit = async (values: FormValues) => {
    setPending(true)
    setServerError(null)

    let content = values.content
    if (location.trim()) {
      content = `${content}\n\n📍 ${location.trim()}`
    }

    if (!collectionWallet) {
      const fd = new FormData()
      fd.set("content", content)
      for (const img of images) {
        fd.append("images", img.key)
      }
      fd.set("signature", "dev")

      const state: FormState = await pinned(undefined, fd)
      setPending(false)
      handleState(state)
      return
    }

    if (!connected || !publicKey || !sendTransaction) {
      setPending(false)
      return
    }

    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(collectionWallet),
          lamports,
        }),
      )
      const sig = await sendTransaction(tx, connection)

      const fd = new FormData()
      fd.set("content", content)
      for (const img of images) {
        fd.append("images", img.key)
      }
      fd.set("signature", sig)

      const state: FormState = await pinned(undefined, fd)
      handleState(state)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed."
      const cancelled =
        message.toLowerCase().includes("rejected") ||
        message.toLowerCase().includes("cancel") ||
        message.toLowerCase().includes("denied")

      if (cancelled) {
        toast.add({
          title: "Transaction cancelled",
          description: "You closed or rejected the request in your wallet.",
          type: "warning",
        })
      }
      setPending(false)
    }
  }

  function handleState(state: FormState) {
    if (state?.errors) {
      setPending(false)
      for (const [key, messages] of Object.entries(state.errors)) {
        if (messages?.[0]) {
          form.setError(key as keyof FormValues, { message: messages[0] })
        }
      }
      return
    }
    if (state?.message) {
      setServerError(state.message)
      setPending(false)
      return
    }

    setOpen(false)
    form.reset()
    setImages([])
    setPending(false)
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <AlertDialogTrigger
              render={
                <Button
                  variant={"outline"}
                  size={"icon"}
                  className="gap-1.5 rounded-full transition-colors border border-primary hover:bg-[#9945FF]/10"
                >
                  <PinIcon className="size-6 rotate-45 text-primary" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Create pinned content</TooltipContent>
      </Tooltip>
      <AlertDialogContent size="default" className="overflow-hidden p-0">
        {/* Header */}
        <AlertDialogHeader className="space-y-0 border-b px-5 py-4 text-left">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#9945FF] to-[#14F195]">
                <PinIcon className="size-4 text-white" />
              </div>
              <div>
                <AlertDialogTitle className="text-base leading-none">
                  Create a pin
                </AlertDialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {collectionWallet
                    ? "Pinned posts stay at the top of the feed"
                    : "Share something with the community"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setOpen(false)}
              className="mt-0.5 shrink-0 rounded-full"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </AlertDialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <div className="flex flex-col gap-3 px-5 pt-4">
            {/* Composer */}
            <div
              className={cn(
                "group relative rounded-xl border bg-muted/30 transition-colors",
                "focus-within:border-[#9945FF]/50 focus-within:bg-background",
                form.formState.errors.content && "border-red-400/60",
              )}
            >
              <Textarea
                {...form.register("content")}
                data-pin-composer
                placeholder="What's happening?"
                rows={3}
                maxLength={MAX_LEN + 40}
                className="resize-none border-none bg-transparent shadow-none focus-visible:ring-0"
                aria-invalid={!!form.formState.errors.content}
              />
              <div className="flex items-center justify-end px-3 pb-2">
                <CharacterRing value={contentValue.length} max={MAX_LEN} />
              </div>
            </div>

            {form.formState.errors.content && (
              <FieldError errors={[form.formState.errors.content]} />
            )}

            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, idx) => (
                  <div key={img.key} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.preview}
                      alt="Preview"
                      className="size-20 rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = images.filter((_, i) => i !== idx)
                        setImages(updated)
                      }}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-0.5">
              <ImageUpload
                images={images}
                onImagesChange={(all) => setImages(all)}
              />
              <EmojiDialog onSelect={insertEmoji} />
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={requestLocation}
                      className="rounded-full"
                    >
                      <MapPin className="size-4" />
                    </Button>
                  }
                />
                <TooltipContent>Add location</TooltipContent>
              </Tooltip>
            </div>

            {location && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                <span>{location}</span>
                <button
                  type="button"
                  onClick={() => setLocation("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            {showLocation && !location && (
              <input
                type="text"
                placeholder="Enter location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#9945FF]/50"
              />
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3.5">
            {collectionWallet ? (
              <div className="flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1">
                <Sparkles className="size-3.5 text-[#9945FF]" />
                <span className="text-xs font-medium">
                  {feeSol} SOL
                  <span className="ml-1 font-normal text-muted-foreground">to pin</span>
                </span>
              </div>
            ) : (
              <span />
            )}

            {collectionWallet && !connected ? (
              <ConnectWallet />
            ) : (
              <Button
                type="submit"
                disabled={pending || !form.formState.isValid}
                size="sm"
                className="gap-1.5"
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {pending ? "Pinning…" : "Pin post"}
              </Button>
            )}
          </div>

          {serverError && (
            <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}