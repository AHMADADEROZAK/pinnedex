"use client";

import { useActionState, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { linkWallet, type LinkWalletState } from "@/features/wallet/actions/linkWallet";

const MESSAGE = "pinnedex wallet link";

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function LinkWallet() {
  const { publicKey, signMessage, connected } = useWallet();
  const [state, formAction, pending] = useActionState<LinkWalletState, FormData>(
    linkWallet,
    undefined,
  );
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!connected || !publicKey || !signMessage) {
      setError("Connect a wallet that supports message signing first.");
      return;
    }

    setSigning(true);
    try {
      const signature = await signMessage(new TextEncoder().encode(MESSAGE));
      const formData = new FormData();
      formData.set("address", publicKey.toBase58());
      formData.set("signature", bytesToBase64(signature));
      formAction(formData);
    } catch {
      setError("Signing was rejected or failed.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Button type="submit" disabled={pending || signing} className="gap-2">
        <Link2 className="size-4" />
        {signing ? "Signing..." : pending ? "Linking..." : "Link Wallet"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-600">Wallet linked: {state.linkedAddress}</p>
      )}
    </form>
  );
}
