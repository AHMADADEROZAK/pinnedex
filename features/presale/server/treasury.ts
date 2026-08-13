import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";

import { presaleConfig, presaleRpcEndpoint } from "@/features/presale/config";

export type TreasuryBalance = {
  sol: number;
  lamports: number;
};

export async function getTreasuryBalance(): Promise<TreasuryBalance | null> {
  const address = presaleConfig.collectionWallet;
  if (!address) return null;

  try {
    const connection = new Connection(presaleRpcEndpoint, "confirmed");
    const lamports = await connection.getBalance(new PublicKey(address));
    return { sol: lamports / 1e9, lamports };
  } catch {
    return null;
  }
}
