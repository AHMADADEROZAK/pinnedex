import { redirect } from "next/navigation";

import { Header } from "@/features/app-shell";
import {
  BuyForm,
  PresaleCountdown,
  TrustSection,
  isPresaleActive,
  presaleConfig,
  getPresaleUsdPrices,
} from "@/features/presale";
import { Purchase } from "@/features/presale/models/Purchase";
import { getTreasuryBalance } from "@/features/presale/server/treasury";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/dal";

export default async function PresalePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const active = isPresaleActive();
  const { tokenPriceUsd, solPriceUsd } = await getPresaleUsdPrices();

  const config = {
    collectionWallet: presaleConfig.collectionWallet,
    tokenPriceUsd,
    solPriceUsd,
    minTokens: presaleConfig.minTokens,
    maxTokens: presaleConfig.maxTokens,
  };

  const endsAt = presaleConfig.end;

  await connectToDatabase();
  const [treasury, verifiedAgg] = await Promise.all([
    getTreasuryBalance(),
    Purchase.aggregate<{ _id: null; total: number }>([
      { $match: { status: "verified" } },
      { $group: { _id: null, total: { $sum: "$solLamports" } } },
    ]).exec(),
  ]);
  const totalSolCollected = (verifiedAgg[0]?.total ?? 0) / 1e9;

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Presale
          </h1>
          <p className="text-sm text-muted-foreground">
            {active
              ? "Buy tokens at the presale price before the app launches."
              : "The presale is not open yet."}
          </p>
        </div>

        {endsAt && (
          <div className="flex flex-col gap-2 rounded-md border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Presale ends on{" "}
              {endsAt.toLocaleString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <PresaleCountdown end={endsAt} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6">
            {presaleConfig.collectionWallet ? (
              <TrustSection
                treasuryAddress={presaleConfig.collectionWallet}
                treasurySol={treasury?.sol ?? null}
                totalSolCollected={totalSolCollected}
              />
            ) : null}
          </div>

          <div className="lg:sticky lg:top-6">
            {active ? (
              <div className="rounded-md border bg-card p-4">
                <h2 className="mb-4 text-sm font-semibold tracking-tight">
                  Buy PINE tokens
                </h2>
                <BuyForm
                  config={config}
                  linkedWallets={user.wallets.map((w) => w.address)}
                />
              </div>
            ) : (
              <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
                Presale opens{" "}
                {presaleConfig.start
                  ? new Date(presaleConfig.start).toLocaleString()
                  : "soon"}
                .
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
