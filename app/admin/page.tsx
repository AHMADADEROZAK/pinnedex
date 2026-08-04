import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Coins,
  ShieldBan,
  CircleDollarSign,
  PinIcon,
  Trophy,
  Sparkles,
  Flame,
  Heart,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

import { requireAdmin } from "@/lib/dal";
import { connectToDatabase } from "@/lib/mongodb";
import { formatUsd } from "@/lib/format";
import { adminBasePath } from "@/lib/admin-path";
import { User } from "@/features/auth";
import { Purchase, getPresaleUsdPrices } from "@/features/presale";
import { BannedIp } from "@/features/security";
import { Post } from "@/features/community/models/Post";
import { Comment } from "@/features/community/models/Comment";
import { getUsdIdrRate } from "@/features/rates/exchangeRate";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function LeaderboardItem({
  rank,
  user,
}: {
  rank: number;
  user: { name: string; email: string; points: number };
}) {
  return (
    <li className="flex items-center gap-3 rounded-md border p-3 text-sm">
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${
          rank === 1
            ? "bg-amber-400/20 text-amber-600"
            : rank === 2
              ? "bg-slate-400/20 text-slate-500"
              : rank === 3
                ? "bg-orange-400/20 text-orange-600"
                : "bg-muted text-muted-foreground"
        }`}
      >
        {rank}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          @{user.email.split("@")[0]}
        </span>
      </div>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {user.points} pts
      </span>
    </li>
  );
}

function PostListItem({
  post,
}: {
  post: {
    id: string;
    author: string;
    content: string;
    likes: number;
    comments: number;
  };
}) {
  return (
    <li className="rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-xs font-medium text-muted-foreground">
          {post.author}
        </span>
        <a
          href={`/community/${post.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
        >
          view <ExternalLink className="size-3" />
        </a>
      </div>
      <p className="mt-1 truncate text-foreground/90">{post.content}</p>
      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Heart className="size-3" />
          {post.likes}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="size-3" />
          {post.comments}
        </span>
      </div>
    </li>
  );
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  await connectToDatabase();

  const [
    userCount,
    walletCount,
    purchaseCount,
    bannedCount,
    postCount,
    commentCount,
    likeCount,
    rate,
    posts,
    commentCounts,
    postAgg,
    commentAgg,
    likeAgg,
  ] = await Promise.all([
    User.countDocuments().exec(),
    User.aggregate([{ $unwind: "$wallets" }, { $count: "total" }]).exec(),
    Purchase.countDocuments().exec(),
    BannedIp.countDocuments().exec(),
    Post.countDocuments().exec(),
    Comment.countDocuments().exec(),
    Post.aggregate([
      { $project: { count: { $size: { $ifNull: ["$likes", []] } } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]).exec(),
    getUsdIdrRate(),
    Post.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("userId", "name email")
      .lean()
      .exec(),
    Comment.aggregate([
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]).exec(),
    Post.aggregate([
      { $group: { _id: "$userId", pins: { $sum: 1 } } },
    ]).exec(),
    Comment.aggregate([
      { $group: { _id: "$userId", comments: { $sum: 1 } } },
    ]).exec(),
    Post.aggregate([
      { $unwind: { path: "$likes", preserveNullAndEmptyArrays: false } },
      { $group: { _id: "$userId", likes: { $sum: 1 } } },
    ]).exec(),
  ]);

  const stats = await Purchase.aggregate([
    {
      $group: {
        _id: null,
        totalTokens: { $sum: "$tokenAllocation" },
        totalSol: { $sum: "$solLamports" },
        verified: { $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
      },
    },
  ]).exec();

  const s = stats[0] ?? {
    totalTokens: 0,
    totalSol: 0,
    verified: 0,
    pending: 0,
  };

  const linkedWallets = walletCount[0]?.total ?? 0;
  const { tokenPriceUsd, solPriceUsd } = await getPresaleUsdPrices();

  const totalSol = s.totalSol / 1e9;
  const totalLikes = likeCount[0]?.total ?? 0;

  const commentCountMap = new Map(
    commentCounts.map((r) => [String(r._id), r.count]),
  );

  const postRows = posts.map((p) => {
    const u = p.userId as unknown as { name?: string; email?: string } | null;
    return {
      id: String(p._id),
      author: u?.name ?? "Unknown",
      content: p.content,
      likes:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((p.likes as any)?.length as number | undefined) ?? 0,
      comments: commentCountMap.get(String(p._id)) ?? 0,
    };
  });

  const topPins = [...postRows]
    .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
    .slice(0, 10);

  const newPins = postRows.slice(0, 10);

  const scoreMap = new Map<string, { pins: number; comments: number; likes: number }>();
  for (const r of postAgg) {
    scoreMap.set(String(r._id), { pins: r.pins, comments: 0, likes: 0 });
  }
  for (const r of commentAgg) {
    const cur = scoreMap.get(String(r._id)) ?? { pins: 0, comments: 0, likes: 0 };
    cur.comments = r.comments;
    scoreMap.set(String(r._id), cur);
  }
  for (const r of likeAgg) {
    const cur = scoreMap.get(String(r._id)) ?? { pins: 0, comments: 0, likes: 0 };
    cur.likes = r.likes;
    scoreMap.set(String(r._id), cur);
  }

  const userIds = [...scoreMap.keys()];
  const users = await User.find({ _id: { $in: userIds } })
    .select("name email")
    .lean()
    .exec();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const leaderboard = [...scoreMap.entries()]
    .map(([userId, sc]) => {
      const u = userMap.get(userId);
      return {
        name: u?.name ?? "Unknown",
        email: u?.email ?? "",
        points: sc.pins + sc.comments + sc.likes,
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
          <LayoutDashboard className="size-6 text-primary" />
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Presale overview · {formatUsd(1)} ≈ {rate.idrPerUsd.toLocaleString()} IDR
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Users"
          value={userCount.toLocaleString()}
          hint={`${linkedWallets.toLocaleString()} wallets`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Purchases"
          value={purchaseCount.toLocaleString()}
          hint={`${s.verified} verified · ${s.pending} pending`}
        />
        <StatCard
          icon={Coins}
          label="Tokens allocated"
          value={s.totalTokens.toLocaleString()}
          hint={`1 PIN = ${formatUsd(tokenPriceUsd)}`}
        />
        <StatCard
          icon={CircleDollarSign}
          label="SOL collected"
          value={`${totalSol.toLocaleString()} SOL`}
          hint={formatUsd(totalSol * solPriceUsd)}
        />
        <StatCard
          icon={PinIcon}
          label="Pins"
          value={postCount.toLocaleString()}
        />
        <StatCard
          icon={MessageCircle}
          label="Comments"
          value={commentCount.toLocaleString()}
        />
        <StatCard
          icon={Heart}
          label="Likes"
          value={totalLikes.toLocaleString()}
        />
        <StatCard
          icon={ShieldBan}
          label="Banned IPs"
          value={bannedCount.toLocaleString()}
          hint={
            bannedCount > 0 ? (
              <a
                href={`${adminBasePath()}/bans`}
                className="text-primary hover:underline"
              >
                manage
              </a>
            ) : undefined
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Trophy className="size-4 text-primary" />
            Leaderboard
          </p>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {leaderboard.map((u, i) => (
                <LeaderboardItem key={u.email} rank={i + 1} user={u} />
              ))}
            </ol>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Sparkles className="size-4 text-primary" />
            New pins
          </p>
          {newPins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pins yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {newPins.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Flame className="size-4 text-primary" />
            Top pins
          </p>
          {topPins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pins yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topPins.map((post) => (
                <PostListItem key={post.id} post={post} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
