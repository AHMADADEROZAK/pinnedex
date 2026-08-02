"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function ConnectWallet() {
  const { connected, publicKey, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = useCallback(() => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  }, [connected, disconnect, setVisible]);

  if (!connected) {
    return (
      <Button onClick={handleClick} disabled={connecting} className="gap-2">
        <Wallet className="size-4" />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleClick} className="gap-2 font-mono">
      <Wallet className="size-4" />
      <span className="size-2 rounded-full " />
      {publicKey ? shortenAddress(publicKey.toBase58()) : ""}
    </Button>
  );
}
