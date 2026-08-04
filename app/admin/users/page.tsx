import { Users } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/features/auth";
import { Purchase } from "@/features/presale";
import { UsersTable } from "./columns";

export default async function AdminUsersPage() {
  await connectToDatabase();

  const users = await User.find().sort({ createdAt: -1 }).lean().exec();

  const walletCounts = await Purchase.aggregate([
    {
      $group: {
        _id: "$userId",
        purchases: { $sum: 1 },
        tokens: { $sum: "$tokenAllocation" },
      },
    },
  ]).exec();

  const byUser = new Map(
    walletCounts.map((r) => [String(r._id), r]),
  );

  const data = users.map((u) => {
    const agg = byUser.get(String(u._id));
    return {
      name: u.name,
      email: u.email,
      role: u.role,
      wallets: u.wallets.length,
      purchases: agg?.purchases ?? 0,
      tokens: agg?.tokens ?? 0,
      joined: new Date(u.createdAt).toLocaleDateString(),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
        <Users className="size-6 text-primary" />
        Users
      </h1>
      <UsersTable data={data} />
    </div>
  );
}
