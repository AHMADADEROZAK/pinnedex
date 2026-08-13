import { Header } from "@/features/app-shell"
import Link from "next/link"
import { Sparkles as SparklesIcon } from "lucide-react"
import { PinDialog } from "@/features/community/components/PinDialog"
import { CommunitySearch } from "@/features/community/components/CommunitySearch"
import { PopularPins } from "@/features/community/components/PopularPins"
import { NewPins } from "@/features/community/components/NewPins"
import type { PostData } from "@/features/community/components/PostCard"
import { communityConfig } from "@/features/community/config"
import { presaleConfig } from "@/features/presale"
import { solanaNetworkName } from "@/features/solana"
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
    solanaNetworkName === "mainnet-beta" ? "" : `?cluster=${solanaNetworkName}`

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

  const popular = postData
    .map((p) => ({
      _id: p._id,
      content: p.content,
      userName: p.userName,
      userEmail: p.userEmail,
      likesCount: p.likesCount,
      commentCount: p.commentCount,
    }))
    .filter((p) => p.likesCount + p.commentCount > 0)
    .sort(
      (a, b) =>
        b.likesCount + b.commentCount - (a.likesCount + a.commentCount),
    )
    .slice(0, 5)

  const newPins = postData
    .slice(0, 5)
    .map((p) => ({
      _id: p._id,
      content: p.content,
      userName: p.userName,
      userEmail: p.userEmail,
      createdAt: p.createdAt,
    }))

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-4 p-4 lg:grid-cols-[5fr_11fr_4fr]">
        <aside className="sticky top-14 hidden self-start lg:block">
          <NewPins pins={newPins} />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Community
            </h1>

            {/* SEARCH */}
            {user ? (
              <PinDialog
                feeSol={communityConfig.feeSol}
                collectionWallet={presaleConfig.collectionWallet}
              />
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#9945FF]/40 px-4 py-1.5 text-sm font-medium text-[#9945FF] transition-colors hover:bg-[#9945FF]/10"
              >
                <SparklesIcon className="size-4" />
                Join to create a pin
              </Link>
            )}
          </div>

          {!user && (
            <div className="rounded-xl border bg-card p-4 text-sm">
              <p className="font-medium">
                You&apos;re viewing the community in preview mode.
              </p>
              <p className="mt-1 text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                or{" "}
                <Link href="/register" className="text-primary hover:underline">
                  create an account
                </Link>{" "}
                to create pins, like, and comment.
              </p>
            </div>
          )}

          <CommunitySearch posts={postData} isAuthenticated={!!user} />
        </div>
        <aside className="sticky top-14 hidden self-start lg:block">
          <PopularPins pins={popular} />
        </aside>
      </main>
    </div>
  )
}
