import { NextResponse } from "next/server"

import { enforceRateLimit } from "@/features/security"
import { getSessionUser } from "@/lib/dal"
import { getPresignedUploadUrl } from "@/lib/minio-client"
import { communityConfig } from "@/features/community/config"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  const limit = await enforceRateLimit()
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 },
    )
  }

  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.fileName !== "string" || typeof body.contentType !== "string" || typeof body.fileSize !== "number") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { fileName, contentType, fileSize } = body as {
    fileName: string
    contentType: string
    fileSize: number
  }

  if (!communityConfig.allowedImageTypes.includes(contentType)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed." }, { status: 400 })
  }

  if (fileSize > communityConfig.maxImageSize) {
    return NextResponse.json({ error: "Image too large." }, { status: 400 })
  }

  const ext = fileName.split(".").pop() ?? "bin"
  const key = `community/${user._id}/${nanoid(12)}.${ext}`

  const presignedUrl = await getPresignedUploadUrl(key)

  return NextResponse.json({ key, presignedUrl })
}
