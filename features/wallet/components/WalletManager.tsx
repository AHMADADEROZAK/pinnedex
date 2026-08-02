"use client";

import { useTransition } from "react";
import { Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinkWallet } from "@/features/wallet/components/LinkWallet";
import { unlinkWallet } from "@/features/wallet/actions/unlinkWallet";

export function WalletManager({ linkedWallets }: { linkedWallets: string[] }) {
  const [pending, startTransition] = useTransition();

  if (linkedWallets.length === 0) {
    return <LinkWallet />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {linkedWallets.map((w) => (
        <li
          key={w}
          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
        >
          <span className="break-all font-mono text-xs">{w}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await unlinkWallet(w);
              })
            }
            className="gap-1 text-xs"
          >
            <Unlink className="size-3" />
            {pending ? "Unlinking..." : "Unlink"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
