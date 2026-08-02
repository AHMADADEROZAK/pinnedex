"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function useSolBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    setLoading(true);
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  const prevPublicKey = useRef(publicKey);
  useEffect(() => {
    if (prevPublicKey.current === publicKey) {
      return;
    }
    prevPublicKey.current = publicKey;
    refresh();
  }, [publicKey, refresh]);

  return { balance, loading, refresh };
}
