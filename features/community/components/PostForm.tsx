"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { Loader2, Send } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet"
import { ImageUpload } from "@/features/community/components/ImageUpload"
import { pinned } from "@/features/community/actions/community"
import { type FormState } from "@/lib/definitions"

const formSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(280, "Max 280 characters."),
})

type FormValues = z.infer<typeof formSchema>

interface PostFormProps {
  feeSol: number
  collectionWallet: string
}

export function PostForm({ feeSol, collectionWallet }: PostFormProps) {
  const { connection } = useConnection()
  const { publicKey, connected, sendTransaction } = useWallet()
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [images, setImages] = useState<{ key: string; preview: string }[]>([])
  const [txError, setTxError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  })

  const contentValue = form.watch("content")
  const lamports = Math.round(feeSol * LAMPORTS_PER_SOL)

  const handlePin = async () => {
    const valid = await form.trigger("content")
    if (!valid) return

    setPending(true)
    setServerError(null)
    setTxError(null)

    const content = form.getValues("content")

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
      } else {
        setTxError(message)
      }
    } finally {
      setPending(false)
    }
  }

  function handleState(state: FormState) {
    if (state?.errors) {
      for (const [key, messages] of Object.entries(state.errors)) {
        if (messages?.[0]) {
          form.setError(key as keyof FormValues, { message: messages[0] })
        }
      }
    }
    if (state?.message) {
      setServerError(state.message)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handlePin()
      }}
      className="flex flex-col gap-3 rounded-md border bg-card p-4"
    >
      <Textarea
        {...form.register("content")}
        placeholder="What's happening?"
        rows={3}
        className="resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        aria-invalid={!!form.formState.errors.content}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
          }
        }}
      />
      {form.formState.errors.content && (
        <FieldError errors={[form.formState.errors.content]} />
      )}

      <ImageUpload
        images={images}
        onImagesChange={(all, _keys) => setImages(all)}
      />

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {contentValue?.length ?? 0}/280
        </span>

        <div className="flex items-center gap-3">
          {collectionWallet && (
            <span className="text-xs text-muted-foreground">{feeSol} SOL</span>
          )}
          {collectionWallet && !connected ? (
            <ConnectWallet />
          ) : (
            <Button type="submit" disabled={pending || !form.formState.isValid} size="sm" >
              {pending && <Loader2 className="size-4 animate-spin" />}
              <Send className="size-4" />
              {pending ? "Pinning..." : "Pin"}
            </Button>
          )}
        </div>
      </div>

      {txError && <p className="text-xs text-destructive">{txError}</p>}
      {serverError && <p className="text-xs text-destructive">{serverError}</p>}
    </form>
  )
}
