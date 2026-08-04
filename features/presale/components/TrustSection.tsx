import { ExternalLink, ShieldCheck } from "lucide-react";

import { solanaNetwork } from "@/features/solana";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function TrustSection({
  treasuryAddress,
  treasurySol,
  totalSolCollected,
  hardcapSol,
}: {
  treasuryAddress: string;
  treasurySol: number | null;
  totalSolCollected: number;
  hardcapSol?: number;
}) {
  const explorerCluster =
    solanaNetwork === "mainnet-beta" ? "" : `?cluster=${solanaNetwork}`;
  const addressUrl = `https://explorer.solana.com/address/${treasuryAddress}${explorerCluster}`;
  const progress = hardcapSol
    ? Math.min(1, Math.max(0, totalSolCollected / hardcapSol))
    : null;

  return (
    <section className="flex flex-col gap-4 rounded-md border bg-card p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">
          Trust & Transparency
        </h2>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <p className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Treasury wallet</span>
          <a
            href={addressUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 items-center gap-1 font-mono text-primary hover:underline"
          >
            <span className="truncate">{shortenAddress(treasuryAddress)}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        </p>
        <p className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Live balance</span>
          <span className="font-medium tabular-nums">
            {treasurySol !== null
              ? `${treasurySol.toFixed(2)} SOL`
              : "Unavailable (RPC offline)"}
          </span>
        </p>
        <p className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">
            Total collected (verified)
          </span>
          <span className="font-medium tabular-nums">
            {totalSolCollected.toFixed(2)} SOL
          </span>
        </p>
        {progress !== null ? (
          <div className="mt-1">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(progress * 100)}% of {hardcapSol?.toLocaleString()} SOL
              hardcap
            </p>
          </div>
        ) : null}
      </div>

      <p className="rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
        Commitment: presale funds are only used to create the liquidity pool.
        The LP is burned after listing as proof of an anti-rug commitment. All
        transactions can be verified directly on the explorer.
      </p>
    </section>
  );
}
