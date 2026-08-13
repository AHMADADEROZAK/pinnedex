import { Header } from "@/features/app-shell";
import { AllocationSection } from "@/features/presale";
import { isDevnet } from "@/features/solana";
import { getSessionUser } from "@/lib/dal";
import { ConnectWallet } from "@/features/wallet/components/ConnectWallet";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  const user = await getSessionUser();
  const linkedWallets = user?.wallets.map((w) => w.address) ?? [];

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-3 font-heading text-2xl font-semibold tracking-tight">
            Claim Tokens
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
            Claim your vested SPINE tokens from the presale.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight">Connect Wallet</h2>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Connect the wallet you used during the presale to view and claim
              your vested tokens.
            </p>
            <ConnectWallet />
            {linkedWallets.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Linked: {linkedWallets.join(", ")}
              </p>
            )}
          </div>

          <AllocationSection />
        </div>
      </main>
    </div>
  );
}
