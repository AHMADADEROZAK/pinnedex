"use server"

import { revalidatePath } from "next/cache"
import { Connection, PublicKey } from "@solana/web3.js"
import * as z from "zod"

import { connectToDatabase } from "@/lib/mongodb"
import { verifySession, requireAdmin } from "@/lib/dal"
import { enforceRateLimit } from "@/features/security"
import { presaleConfig } from "@/features/presale/config"
import { resolveRpcEndpoint } from "@/features/solana/server"
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
  signature: z
    .string()
    .min(1, { error: "Transaction signature is required." })
    .trim(),
})

export async function pinned(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = await enforceRateLimit()
  if (!limit.allowed) {
    return { message: "Too many requests. Please wait a minute." }
  }

  const session = await verifySession()

  const raw = {
    content: formData.get("content"),
    images: formData.getAll("images"),
    signature: formData.get("signature"),
  }

  const validated = PinnedSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors as Record<string, string[]> }
  }

  const { content, images, signature } = validated.data

  await connectToDatabase()

  const existing = await Post.findOne({ txSignature: signature }).exec()
  if (existing) {
    return {
      errors: { signature: ["This transaction signature has already been used."] },
    }
  }

  if (presaleConfig.collectionWallet) {
    const verified = await verifyCommunityPayment(signature)
    if (!verified.ok) {
      return { errors: { signature: [verified.error] } }
    }
  }

  const post = new Post({
    content,
    images,
    userId: session.userId,
    txSignature: signature,
    solLamports: communityConfig.feeLamports,
  })
  await post.save()

  revalidatePath("/community")

  return undefined
}

function toPublicKey(address: string): PublicKey | null {
  try {
    return new PublicKey(address)
  } catch {
    return null
  }
}

async function verifyCommunityPayment(
  txSignature: string,
): Promise<{ ok: true; lamports: number } | { ok: false; error: string }> {
  const signature = txSignature.trim()
  if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)) {
    return { ok: false, error: "Invalid transaction signature." }
  }

  const collectionPk = toPublicKey(presaleConfig.collectionWallet)
  if (!collectionPk) {
    return { ok: false, error: "Collection wallet is not configured." }
  }

  const connection = new Connection(resolveRpcEndpoint(), "confirmed")

  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  })

  if (!tx) {
    return { ok: false, error: "Transaction not found. Check the signature or wait a moment." }
  }

  if (tx.meta?.err !== null) {
    return { ok: false, error: "Transaction failed on-chain." }
  }

  const message = tx.transaction.message
  let lamports = 0

  for (const ix of message.instructions) {
    if ("parsed" in ix && ix.program === "system") {
      const parsed = ix.parsed as {
        type?: string
        info?: { destination?: string; lamports?: number }
      }
      if (
        parsed.type === "transfer" &&
        parsed.info?.destination === collectionPk.toString()
      ) {
        lamports += parsed.info.lamports ?? 0
      }
    }
  }

  const requiredSol = communityConfig.feeSol
  if (lamports < communityConfig.feeLamports) {
    return {
      ok: false,
      error: `Payment not met. Send at least ${requiredSol} SOL to the collection wallet.`,
    }
  }

  return { ok: true, lamports }
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

  const session = await verifySession()

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
    userId: session.userId,
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

  const session = await verifySession()

  await connectToDatabase()

  const post = await Post.findById(postId).exec()
  if (!post) return

  const userId = session.userId
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
