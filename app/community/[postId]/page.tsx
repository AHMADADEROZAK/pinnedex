import { ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Header } from "@/features/app-shell"
import { InlineCommentForm } from "@/features/community/components/InlineCommentForm"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { solanaNetworkName } from "@/features/solana"
import { connectToDatabase } from "@/lib/mongodb"
import { getSessionUser } from "@/lib/dal"
import { Post } from "@/features/community/models/Post"
import { Comment } from "@/features/community/models/Comment"
import { getPresignedDownloadUrl } from "@/lib/minio-client"

const initials = (n: string) =>
  n
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = await params
  const user = await getSessionUser()

  await connectToDatabase()

  const p = await Post.findById(postId).populate("userId", "name email").lean().exec()
  if (!p) {
    return (
      <div className="flex min-h-svh flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
          <Link href="/community" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <p className="text-sm text-muted-foreground">Post not found.</p>
        </main>
      </div>
    )
  }

  const u = p.userId as unknown as { name: string; email: string } | null
  const imageUrls = await Promise.all(
    (p.images ?? []).map(async (key: string) => ({
      key,
      url: await getPresignedDownloadUrl(key).catch(() => ""),
    })),
  )

  const comments = await Comment.find({ postId })
    .sort({ createdAt: 1 })
    .populate("userId", "name email")
    .lean()
    .exec()

  const explorerCluster =
    solanaNetworkName === "mainnet-beta" ? "" : `?cluster=${solanaNetworkName}`

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to community
        </Link>

        {/* Post */}
        <div className="flex gap-3 rounded-md border bg-card p-4">
          <Avatar size="default" className="shrink-0">
            <AvatarFallback>{initials(u?.name ?? "U")}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{u?.name ?? "Unknown"}</span>
              <span className="text-xs text-muted-foreground">
                @{u?.email?.split("@")[0] ?? "unknown"}
              </span>
              <span className="text-xs text-muted-foreground">
                · {timeAgo((p as unknown as { createdAt: Date }).createdAt?.toISOString() ?? "")}
              </span>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.content}</p>

            {imageUrls.length > 0 && (
              <div className={`grid gap-1 ${imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {imageUrls.map((img) => (
                  <a key={img.key} href={img.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt="Post image"
                      className="max-h-80 w-full rounded-md border object-cover"
                    />
                  </a>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 border-t pt-2">
              <span className="text-xs text-muted-foreground">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(p.likes as any)?.length ?? 0} likes
              </span>
              <span className="text-xs text-muted-foreground">
                {comments.length} comments
              </span>
              <a
                href={`https://explorer.solana.com/tx/${p.txSignature}${explorerCluster}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">Comments ({comments.length})</h2>

          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {await Promise.all(
                comments.map(async (c) => {
                  const cu = c.userId as unknown as { name: string; email: string } | null
                  const cImages = await Promise.all(
                    (c.images ?? []).map(async (key: string) => ({
                      key,
                      url: await getPresignedDownloadUrl(key).catch(() => ""),
                    })),
                  )
                  return (
                    <div key={String(c._id)} className="flex gap-2">
                      <Avatar size="sm" className="shrink-0">
                        <AvatarFallback>{initials(cu?.name ?? "U")}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col rounded-lg bg-muted/40 px-3 py-2 gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{cu?.name ?? "Unknown"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            · {timeAgo((c as unknown as { createdAt: Date }).createdAt?.toISOString() ?? "")}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed">{c.content}</p>
                        {cImages.length > 0 && (
                          <div className={`grid gap-1 ${cImages.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                            {cImages.map((img) => (
                              <a key={img.key} href={img.url} target="_blank" rel="noopener noreferrer">
                                <img src={img.url} alt="" className="max-h-48 w-full rounded-md border object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }),
              )}
            </div>
          )}

          {user ? (
            <InlineCommentForm postId={postId} />
          ) : (
            <div className="rounded-xl border bg-card p-4 text-sm">
              <p className="font-medium">Sign in to join the discussion.</p>
              <p className="mt-1 text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                or{" "}
                <Link href="/register" className="text-primary hover:underline">
                  create an account
                </Link>{" "}
                to comment on pins and join the community.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
