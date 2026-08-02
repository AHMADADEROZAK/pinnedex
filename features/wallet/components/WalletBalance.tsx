"use client";

import { useSolBalance } from "@/features/wallet/hooks/useSolBalance";
import Image from "next/image";

export function WalletBalance() {
  const { balance, loading } = useSolBalance();

  if (loading || balance === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 bg-background px-3 py-2 text-sm">
      <Image src={"/solanaLogoMark.svg"} alt={"solana"} width={14} height={14} />
      <span className="font-mono">
        {balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
      </span>
      <span className="text-muted-foreground">SOL</span>
    </div>
  );
}
