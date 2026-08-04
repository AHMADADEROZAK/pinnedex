"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send, Loader2, MapPin, X } from "lucide-react"
import { useRouter } from "next/navigation"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
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
        <circle cx="11" cy="11" r={radius} fill="none" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct)}
          className={cn("transition-[stroke-dashoffset,stroke] duration-200 ease-out", isOver ? "stroke-red-500" : isNearLimit ? "stroke-amber-500" : "stroke-[#9945FF]")}
        />
      </svg>
    </div>
  )
}

export function InlineCommentForm({ postId }: { postId: string }) {
  const router = useRouter()
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
    const textarea = document.querySelector<HTMLTextAreaElement>("[data-inline-comment]")
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

    form.reset()
    setImages([])
    setLocation("")
    setPending(false)
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className={cn("group relative rounded-xl border bg-muted/30 transition-colors", "focus-within:border-[#9945FF]/50 focus-within:bg-background")}>
        <Textarea {...form.register("content")} data-inline-comment placeholder="Write a comment..." rows={2} maxLength={MAX_LEN + 40} className="resize-none border-none bg-transparent shadow-none focus-visible:ring-0" />
        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-0.5">
            <ImageUpload images={images} onImagesChange={(all) => setImages(all)} />
            <EmojiDialog onSelect={insertEmoji} />
            <Tooltip>
              <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-sm" onClick={requestLocation} className="rounded-full"><MapPin className="size-4" /></Button>} />
              <TooltipContent>Add location</TooltipContent>
            </Tooltip>
          </div>
          <CharacterRing value={contentValue.length} max={MAX_LEN} />
        </div>
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={img.key} className="group relative">
              <img src={img.preview} alt="" className="size-16 rounded-md border object-cover" />
              <button type="button" onClick={() => setImages((p) => p.filter((_, i) => i !== idx))} className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {location && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5" /><span>{location}</span>
          <button type="button" onClick={() => setLocation("")} className="text-muted-foreground hover:text-foreground"><X className="size-3" /></button>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {serverError && <p className="mr-auto text-sm text-destructive">{serverError}</p>}
        <Button type="submit" disabled={pending} size="sm" className="gap-1.5">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          {pending ? "Sending…" : "Comment"}
        </Button>
      </div>
    </form>
  )
}
