import "server-only"

import { nanoid } from "nanoid"

import { uploadFile, getPresignedDownloadUrl } from "@/lib/minio-client"
import { communityConfig } from "@/features/community/config"

export async function saveImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin"
  const key = `community/${userId}/${nanoid(12)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadFile({
    key,
    buffer,
    contentType: file.type || "application/octet-stream",
  })

  return key
}

export async function getImageUrl(key: string): Promise<string> {
  return getPresignedDownloadUrl(key)
}

export function validateImage(file: File): string | null {
  if (!communityConfig.allowedImageTypes.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed."
  }
  if (file.size > communityConfig.maxImageSize) {
    const mb = (communityConfig.maxImageSize / (1024 * 1024)).toFixed(0)
    return `Image must be smaller than ${mb}MB.`
  }
  return null
}
