import { PostCard, type PostData } from "@/features/community/components/PostCard"

export type { PostData }

export function PostFeed({
  posts,
  isAuthenticated,
}: {
  posts: PostData[]
  isAuthenticated: boolean
}) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
        <p className="text-sm">No pins yet.</p>
        <p className="text-xs">Be the first to pin something!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} isAuthenticated={isAuthenticated} />
      ))}
    </div>
  )
}
