"use client";

import { LoaderCircle, Sparkles } from "lucide-react";

import { useAirdrop } from "@/features/wallet/hooks/useAirdrop";
import { Button } from "@/components/ui/button";

export function AirdropButton({
  onAirdropped,
}: {
  onAirdropped?: () => void;
}) {
  const { requestAirdrop, airdropPending, airdropError } = useAirdrop();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={"outline"}
        onClick={async () => {
          await requestAirdrop(1);
          onAirdropped?.();
        }}
        disabled={airdropPending}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        {airdropPending ? (
          <LoaderCircle className="size-3 animate-spin" />
        ) : (
          <Sparkles className="size-3" />
        )}
        {airdropPending ? "Air-dropping..." : "Airdrop 1 SOL"}
      </Button>
      {airdropError ? (
        <span className="text-xs text-destructive">{airdropError}</span>
      ) : null}
    </div>
  );
}
