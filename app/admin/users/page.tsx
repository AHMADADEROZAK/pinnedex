import { Users } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/features/auth";
import { Purchase } from "@/features/presale";

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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
        <Users className="size-6 text-primary" />
        Users
      </h1>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Wallets</th>
              <th className="p-3 font-medium text-right">Purchases</th>
              <th className="p-3 font-medium text-right">Tokens</th>
              <th className="p-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-3 text-muted-foreground">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const agg = byUser.get(String(u._id));
                return (
                  <tr key={String(u._id)} className="border-b last:border-0">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3 text-muted-foreground">{u.email}</td>
                    <td className="p-3">
                      {u.role === "admin" ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          admin
                        </span>
                      ) : (
                        <span className="text-muted-foreground">user</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.wallets.length}
                    </td>
                    <td className="p-3 text-right">
                      {agg?.purchases ?? 0}
                    </td>
                    <td className="p-3 text-right">
                      {(agg?.tokens ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
