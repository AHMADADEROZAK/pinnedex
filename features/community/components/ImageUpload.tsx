"use client"

import { useState, useRef } from "react"
import { ImagePlus, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface UploadedImage {
  key: string
  preview: string
}

interface ImageUploadProps {
  images: UploadedImage[]
  onImagesChange: (images: UploadedImage[], keys: string[]) => void
}

export function ImageUpload({ images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    setUploading(true)

    const results: UploadedImage[] = []

    for (const file of Array.from(files)) {
      try {
        const presignedRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        })

        if (!presignedRes.ok) {
          const err = await presignedRes.json()
          setError(err.error ?? "Upload failed.")
          continue
        }

        const { key, presignedUrl } = await presignedRes.json()

        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })

        if (!uploadRes.ok) {
          setError("Failed to upload image to storage.")
          continue
        }

        results.push({ key, preview: URL.createObjectURL(file) })
      } catch {
        setError("Upload failed.")
      }
    }

    const updated = [...images, ...results]
    onImagesChange(updated, updated.map((i) => i.key))
    setUploading(false)

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-full"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
            </Button>
          }
        />
        <TooltipContent>Add image</TooltipContent>
      </Tooltip>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  )
}
