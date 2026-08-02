import { Trophy } from "lucide-react";

import { Header } from "@/features/app-shell";
import { connectToDatabase } from "@/lib/mongodb";
import { Purchase } from "@/features/presale/models/Purchase";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default async function LeaderboardPage() {
  await connectToDatabase();

  const purchases = await Purchase.aggregate([
    { $match: { status: "verified" } },
    {
      $group: {
        _id: "$walletAddress",
        totalTokens: { $sum: "$tokenAllocation" },
        totalSol: { $sum: "$solLamports" },
        purchases: { $sum: 1 },
      },
    },
    { $sort: { totalTokens: -1 } },
    { $limit: 50 },
  ]).exec();

  const rankColors = ["text-amber-500", "text-slate-400", "text-orange-700"];

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-6 text-primary" />
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Leaderboard
          </h1>
        </div>

        {purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No verified purchases yet. Be the first!
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {purchases.map((p, i) => (
              <li
                key={p._id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center font-semibold ${
                      rankColors[i] ?? "text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-mono">{shortenAddress(p._id)}</span>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <span className="font-medium">
                    {p.totalTokens.toLocaleString()} tokens
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {(p.totalSol / 1e9).toFixed(2)} SOL · {p.purchases} tx
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
