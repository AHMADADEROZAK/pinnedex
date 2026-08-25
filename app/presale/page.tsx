import { Header } from "@/features/app-shell";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  BuyForm,
  PresaleCountdown,
  isPresaleActive,
  presaleConfig,
  getPresaleUsdPrices,
} from "@/features/presale";
import { PresaleSummaryCards } from "@/features/presale/components/PresaleSummaryCards";
import { ContractDetails } from "@/features/presale/components/ContractDetails";
import { ContractAddressBanner } from "@/features/app-shell/components/ContractAddressBanner";
import { isDevnet } from "@/features/solana";
import { getSessionUser } from "@/lib/dal";

export const dynamic = "force-dynamic";

export default async function PresalePage() {
  const user = await getSessionUser();
  const signedIn = Boolean(user);

  const active = isPresaleActive();
  const { tokenPriceUsd, solPriceUsd } = await getPresaleUsdPrices();

  const vaultAddress = presaleConfig.collectionWallet;
  const config = {
    programId: presaleConfig.programId,
    collectionWallet: vaultAddress,
    tokenPriceUsd,
    solPriceUsd,
    minTokens: presaleConfig.minTokens,
    maxTokens: presaleConfig.maxTokens,
  };

  const endsAt = presaleConfig.end;

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
        <ContractAddressBanner variant="hero" />
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-3 font-heading text-2xl font-semibold tracking-tight">
            Presale
            {isDevnet && (
              <span className="relative inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-amber-500 shadow-[0_0_12px_-2px_var(--color-amber-500)] backdrop-blur-md">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-80" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-amber-500" />
                </span>
                Devnet
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {active
              ? "Buy SPINE tokens at the presale price before the app launches."
              : "The presale is not open yet."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            <PresaleSummaryCards />
            <ContractDetails />
          </div>

          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
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

            <Link
              href="/presale/claim"
              className="flex items-center justify-between gap-2 rounded-md border bg-card p-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              <span>Already bought? Claim your SPINE</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
            {active ? (
              <div className="rounded-md border bg-card p-4">
                <h2 className="mb-4 text-sm font-semibold tracking-tight">
                  Buy SPINE tokens
                </h2>
                <BuyForm
                  config={config}
                  linkedWallets={user?.wallets.map((w) => w.address) ?? []}
                  signedIn={signedIn}
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

