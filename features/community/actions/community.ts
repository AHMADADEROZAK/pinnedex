"use server"

import { revalidatePath } from "next/cache"
import * as z from "zod"

import { connectToDatabase } from "@/lib/mongodb"
import { verifySession, requireAdmin, getSessionUser } from "@/lib/dal"
import { enforceRateLimit } from "@/features/security"
import { communityConfig } from "@/features/community/config"
import { Post } from "@/features/community/models/Post"
import { Comment } from "@/features/community/models/Comment"
import { deleteFile } from "@/lib/minio-client"
import { type FormState } from "@/lib/definitions"

const PinnedSchema = z.object({
  content: z
    .string()
    .min(1, { error: "Post cannot be empty." })
    .max(communityConfig.maxContentLength, {
      error: `Post cannot exceed ${communityConfig.maxContentLength} characters.`,
    })
    .trim(),
  images: z
    .array(z.string())
    .max(communityConfig.maxImages)
    .default([]),
})

export async function pinned(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = await enforceRateLimit()
  if (!limit.allowed) {
    return { message: "Too many requests. Please wait a minute." }
  }

  await verifySession()
  const user = await getSessionUser()
  if (!user) {
    return { message: "Sesi tidak valid. Silakan login ulang." }
  }

  const raw = {
    content: formData.get("content"),
    images: formData.getAll("images"),
  }

  const validated = PinnedSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { content, images } = validated.data

  await connectToDatabase()

  const post = new Post({
    content,
    images,
    userId: user._id,
  })
  await post.save()

  revalidatePath("/community")

  return undefined
}

const CommentSchema = z.object({
  content: z
    .string()
    .min(1, { error: "Comment cannot be empty." })
    .max(280, { error: "Max 280 characters." })
    .trim(),
  postId: z.string().min(1),
  images: z.array(z.string()).max(4).default([]),
})

export async function comment(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = await enforceRateLimit()
  if (!limit.allowed) {
    return { message: "Too many requests. Please wait a minute." }
  }

  await verifySession()
  const user = await getSessionUser()
  if (!user) {
    return { errors: { postId: ["Sesi tidak valid. Silakan login ulang."] } }
  }

  const validated = CommentSchema.safeParse({
    content: formData.get("content"),
    postId: formData.get("postId"),
    images: formData.getAll("images"),
  })
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { content, postId, images } = validated.data

  await connectToDatabase()

  const post = await Post.findById(postId).exec()
  if (!post) {
    return { errors: { postId: ["Post not found."] } }
  }

  const c = new Comment({
    content,
    images,
    postId,
    userId: user._id,
  })
  await c.save()

  revalidatePath("/community")

  return undefined
}

export async function toggleLike(postId: string) {
  const limit = await enforceRateLimit()
  if (!limit.allowed) {
    return
  }

  await verifySession()
  const user = await getSessionUser()
  if (!user) return

  await connectToDatabase()

  const post = await Post.findById(postId).exec()
  if (!post) return

  const userId = String(user._id)
  if (!post.likes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(post as any).likes = []
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = post.likes.findIndex((id: any) => id.toString() === userId)

  if (existing >= 0) {
    post.likes.splice(existing, 1)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    post.likes.push(userId as any)
  }

  await post.save()

  revalidatePath("/community")
}

export async function deletePost(postId: string) {
  await requireAdmin()

  await connectToDatabase()

  const post = await Post.findByIdAndDelete(postId).exec()
  if (!post) return

  await Promise.allSettled(
    (post.images ?? []).map((key) => deleteFile(key).catch(() => {})),
  )

  await Comment.deleteMany({ postId }).exec()

  revalidatePath("/community")
  revalidatePath("/community/[postId]")
  revalidatePath("/admin/pins")
}
