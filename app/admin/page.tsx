import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Coins,
  ShieldBan,
  CircleDollarSign,
} from "lucide-react";

import { requireAdmin } from "@/lib/dal";
import { connectToDatabase } from "@/lib/mongodb";
import { formatUsd } from "@/lib/format";
import { adminBasePath } from "@/lib/admin-path";
import { User } from "@/features/auth";
import { Purchase, getPresaleUsdPrices } from "@/features/presale";
import { BannedIp } from "@/features/security";
import { getUsdIdrRate } from "@/features/rates/exchangeRate";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
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

export default async function AdminDashboardPage() {
  await requireAdmin();
  await connectToDatabase();

  const [userCount, walletCount, purchaseCount, bannedCount, recentPurchases, recentUsers, rate] =
    await Promise.all([
      User.countDocuments().exec(),
      User.aggregate([
        { $unwind: "$wallets" },
        { $count: "total" },
      ]).exec(),
      Purchase.countDocuments().exec(),
      BannedIp.countDocuments().exec(),
      Purchase.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .lean()
        .exec(),
      User.find().sort({ createdAt: -1 }).limit(8).lean().exec(),
      getUsdIdrRate(),
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
          hint={`${linkedWallets.toLocaleString()} wallets linked`}
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium">Recent purchases</p>
          {recentPurchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentPurchases.map((p) => (
                <li
                  key={p.txSignature}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-mono">{shortenAddress(p.walletAddress)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-medium">
                      {p.tokenAllocation.toLocaleString()} tokens
                    </span>
                    <span
                      className={`text-xs ${
                        p.status === "verified"
                          ? "text-emerald-600"
                          : p.status === "rejected"
                            ? "text-red-600"
                            : "text-amber-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-sm font-medium">Recent users</p>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentUsers.map((u) => (
                <li
                  key={String(u._id)}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate">{u.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="font-mono text-xs text-muted-foreground">
                      {u.wallets.length} wallets
                    </span>
                    {u.role === "admin" ? (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs">admin</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
        <ShieldBan className="size-4 text-primary" />
        <span>
          {bannedCount.toLocaleString()} banned IP
          {bannedCount === 1 ? "" : "s"} ·{" "}
          <a
            href={`${adminBasePath()}/bans`}
            className="text-primary hover:underline"
          >
            manage bans
          </a>
        </span>
      </div>
    </div>
  );
}
