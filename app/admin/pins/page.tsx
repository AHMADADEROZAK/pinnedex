import { PinIcon } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { Post } from "@/features/community/models/Post";
import { Comment } from "@/features/community/models/Comment";
import { PinsTable } from "./columns";

export default async function AdminPinsPage() {
  await connectToDatabase();

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("userId", "name email")
    .lean()
    .exec();

  const commentCounts = await Comment.aggregate([
    { $group: { _id: "$postId", count: { $sum: 1 } } },
  ]).exec();
  const commentCountMap = new Map(
    commentCounts.map((r) => [String(r._id), r.count]),
  );

  const data = posts.map((p) => {
    const u = p.userId as unknown as { name?: string; email?: string } | null;
    return {
      id: String(p._id),
      author: u?.name ?? "Unknown",
      email: u?.email ?? "",
      content: p.content,
      likes:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((p.likes as any)?.length as number | undefined) ?? 0,
      comments: commentCountMap.get(String(p._id)) ?? 0,
      txSignature: p.txSignature,
      date: new Date(p.createdAt).toLocaleString(),
      postUrl: `/community/${String(p._id)}`,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
        <PinIcon className="size-6 text-primary" />
        Community Pins
      </h1>
      <PinsTable data={data} />
    </div>
  );
}
