"use client"

import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Send } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FieldError } from "@/components/ui/field"
import { ImageUpload } from "@/features/community/components/ImageUpload"
import { pinned } from "@/features/community/actions/community"
import { type FormState } from "@/lib/definitions"

const formSchema = z.object({
  content: z.string().min(1, "Post cannot be empty.").max(280, "Max 280 characters."),
})

type FormValues = z.infer<typeof formSchema>

export function PostForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [images, setImages] = useState<{ key: string; preview: string }[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { content: "" },
  })

  const contentValue = useWatch({ control: form.control, name: "content" })

  async function onSubmit(values: FormValues) {
    setPending(true)
    setServerError(null)

    const fd = new FormData()
    fd.set("content", values.content)
    for (const img of images) {
      fd.append("images", img.key)
    }

    const state: FormState = await pinned(undefined, fd)

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

    if (!state?.errors && !state?.message) {
      form.reset({ content: "" })
      setImages([])
    }

    setPending(false)
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
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
        onImagesChange={(all) => setImages(all)}
      />

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {contentValue?.length ?? 0}/280
        </span>

        <Button type="submit" disabled={pending || !form.formState.isValid} size="sm">
          {pending && <Loader2 className="size-4 animate-spin" />}
          <Send className="size-4" />
          {pending ? "Pinning..." : "Pin"}
        </Button>
      </div>

      {serverError && <p className="text-xs text-destructive">{serverError}</p>}
    </form>
  )
}
