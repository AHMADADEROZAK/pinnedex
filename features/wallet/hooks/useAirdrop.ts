"use client";

import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export function useAirdrop() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [airdropPending, setAirdropPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestAirdrop = useCallback(
    async (amount: number = 1) => {
      if (!publicKey) {
        return;
      }

      setAirdropPending(true);
      setError(null);
      try {
        const lamports = amount * LAMPORTS_PER_SOL;
        const signature = await connection.requestAirdrop(
          publicKey as PublicKey,
          lamports
        );
        await connection.confirmTransaction(signature, "confirmed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Airdrop failed");
      } finally {
        setAirdropPending(false);
      }
    },
    [connection, publicKey]
  );

  return { requestAirdrop, airdropPending, airdropError: error };
}
