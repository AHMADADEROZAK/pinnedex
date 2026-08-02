"use client";

import { Coins } from "lucide-react";

import { useSolBalance } from "@/features/wallet/hooks/useSolBalance";

export function WalletBalance() {
  const { balance, loading } = useSolBalance();

  if (loading || balance === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm">
      <Coins className="size-4 text-muted-foreground" />
      <span className="font-mono">
        {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      </span>
      <span className="text-muted-foreground">SOL</span>
    </div>
  );
}
