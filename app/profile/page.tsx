import { redirect } from "next/navigation";
import { ExternalLink, Shield } from "lucide-react";
import { Types } from "mongoose";

import { Header } from "@/features/app-shell";
import { LogoutButton } from "@/features/auth";
import { WalletManager } from "@/features/wallet";
import { solanaNetwork } from "@/features/solana";
import { formatUsd } from "@/lib/format";
import { adminBasePath } from "@/lib/admin-path";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/dal";
import { Purchase } from "@/features/presale/models/Purchase";
import { getPresaleUsdPrices } from "@/features/presale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  await connectToDatabase();

  const filter = {
    userId: new Types.ObjectId(user._id),
  } as unknown as Parameters<typeof Purchase.find>[0];

  const purchases = await Purchase.find(filter)
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  const { tokenPriceUsd } = await getPresaleUsdPrices();

  const explorerCluster =
    solanaNetwork === "mainnet-beta" ? "" : `?cluster=${solanaNetwork}`;

  const txUrl = (sig: string) =>
    `https://explorer.solana.com/tx/${sig}${explorerCluster}`;

  const totalTokens = purchases.reduce((sum, p) => sum + p.tokenAllocation, 0);
  const totalSol = purchases.reduce((sum, p) => sum + p.solLamports, 0);

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "admin" ? (
              <a
                href={adminBasePath()}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                <Shield className="size-4 text-primary" />
                Admin
              </a>
            ) : null}
            <LogoutButton />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Linked wallets</p>
          <WalletManager linkedWallets={user.wallets.map((w) => w.address)} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Total tokens</p>
            <p className="font-heading text-2xl font-semibold">
              {totalTokens.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Total SOL</p>
            <p className="font-heading text-2xl font-semibold">
              {(totalSol / 1e9).toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-xs text-muted-foreground">Value (USD)</p>
            <p className="font-heading text-2xl font-semibold">
              {formatUsd(totalTokens * tokenPriceUsd)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Purchases</p>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t bought any tokens yet.{" "}
              <a href="/presale" className="text-primary hover:underline">
                Join the presale
              </a>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {purchases.map((p) => (
                <li key={p.txSignature} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-medium ${
                        p.status === "verified" ? "text-emerald-600" : ""
                      }`}
                    >
                      {p.tokenAllocation.toLocaleString()} tokens
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-2">
                    <a
                      href={txUrl(p.txSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="size-3.5 shrink-0" />
                      <span className="truncate font-mono text-xs">
                        {p.txSignature}
                      </span>
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Note: 1 token = {formatUsd(tokenPriceUsd)} · airdrop allocations will be
          executed after the presale.
        </p>
      </main>
    </div>
  );
}
