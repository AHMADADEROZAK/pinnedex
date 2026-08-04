import { NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/mongodb"
import { Comment } from "@/features/community/models/Comment"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")

  if (!postId) {
    return NextResponse.json([], { status: 200 })
  }

  await connectToDatabase()

  const comments = await Comment.find({ postId })
    .sort({ createdAt: 1 })
    .populate("userId", "name email")
    .lean()
    .exec()

  const data = comments.map((c) => {
    const u = c.userId as unknown as { name: string; email: string } | null
    return {
      _id: String(c._id),
      content: c.content,
      images: c.images ?? [],
      userName: u?.name ?? "Unknown",
      userEmail: u?.email ?? "",
      createdAt: (c as unknown as { createdAt: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
    }
  })

  return NextResponse.json(data)
}
