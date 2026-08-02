"use client";

import { solanaNetwork, networkLabel } from "@/features/solana/config";

export function NetworkBadge() {
  return (
    <span className="hidden rounded-md border px-2 py-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
      {networkLabel[solanaNetwork]}
    </span>
  );
}
