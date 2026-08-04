import { Header } from "@/features/app-shell"
import { PinDialog } from "@/features/community/components/PinDialog"
import { PostFeed } from "@/features/community/components/PostFeed"
import type { PostData } from "@/features/community/components/PostCard"
import { communityConfig } from "@/features/community/config"
import { presaleConfig } from "@/features/presale"
import { solanaNetwork } from "@/features/solana"
import { connectToDatabase } from "@/lib/mongodb"
import { getSessionUser } from "@/lib/dal"
import { Post } from "@/features/community/models/Post"
import { Comment } from "@/features/community/models/Comment"
import { getPresignedDownloadUrl } from "@/lib/minio-client"

export default async function CommunityPage() {
  const user = await getSessionUser()

  await connectToDatabase()

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("userId", "name email")
    .lean()
    .exec()

  const explorerCluster =
    solanaNetwork === "mainnet-beta" ? "" : `?cluster=${solanaNetwork}`

  const userId = user?._id?.toString() ?? ""

  const commentCounts = await Comment.aggregate([
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]).exec()
  const commentCountMap = new Map(
    commentCounts.map((r) => [String(r._id), r.count]),
  )

  const postData: PostData[] = await Promise.all(
    posts.map(async (p) => {
      const u = p.userId as unknown as { name: string; email: string } | null
      const imageUrls = await Promise.all(
        (p.images ?? []).map(async (key: string) => ({
          key,
          url: await getPresignedDownloadUrl(key).catch(() => ""),
        })),
      )

      return {
        _id: String(p._id),
        content: p.content,
        images: imageUrls,
        userName: u?.name ?? "Unknown",
        userEmail: u?.email ?? "",
        txSignature: p.txSignature,
        createdAt: (p as unknown as { createdAt: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
        explorerTxUrl: `https://explorer.solana.com/tx/${p.txSignature}${explorerCluster}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        likesCount: (p.likes as any)?.length ?? 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        likedByMe: (p.likes as any)?.some((lid: any) => lid.toString() === userId) ?? false,
        commentCount: commentCountMap.get(String(p._id)) ?? 0,
      }
    }),
  )

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Community
          </h1>
          {user && (
            <PinDialog
              feeSol={communityConfig.feeSol}
              collectionWallet={presaleConfig.collectionWallet}
            />
          )}
        </div>

        <PostFeed posts={postData} />
      </main>
    </div>
  )
}
