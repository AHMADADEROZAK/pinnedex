"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { PostFeed } from "@/features/community/components/PostFeed"
import type { PostData } from "@/features/community/components/PostCard"

export function CommunitySearch({
  posts,
  isAuthenticated = true,
}: {
  posts: PostData[]
  isAuthenticated?: boolean
}) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((p) =>
      [p.content, p.userName, p.userEmail].some((v) =>
        v.toLowerCase().includes(q),
      ),
    )
  }, [posts, query])

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pins, people..."
          className="pl-9"
        />
      </div>
      <PostFeed posts={filtered} isAuthenticated={isAuthenticated} />
    </>
  )
}
