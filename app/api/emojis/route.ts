import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongodb"
import { enforceRateLimit } from "@/features/security"
import { Emoji } from "@/features/community/models/Emoji"

export async function GET(request: Request) {
  const limit = await enforceRateLimit(60)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 },
    )
  }

  const { searchParams } = new URL(request.url)
  const group = searchParams.get("group")

  await connectToDatabase()

  const filter = group ? { group } : {}
  const emojis = await Emoji.find(filter).lean().exec()

  return NextResponse.json(emojis)
}
