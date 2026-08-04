import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongodb"
import { Emoji } from "@/features/community/models/Emoji"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const group = searchParams.get("group")

  await connectToDatabase()

  const filter = group ? { group } : {}
  const emojis = await Emoji.find(filter).lean().exec()

  return NextResponse.json(emojis)
}
