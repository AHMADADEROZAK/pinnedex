import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { TokenMarketSnapshot } from "../models/TokenMarketSnapshot";

export interface MarketStats {
  priceUsd: number;
  volume24h: number;
  marketCap: number | null;
  fdv: number | null;
  liquidityUsd: number | null;
  priceChange24h: number | null;
  txnsBuys24h: number;
  txnsSells24h: number;
  pairAddress: string;
  dexId: string;
  fetchedAt: Date;
}

export async function getLatestMarketSnapshot(): Promise<MarketStats | null> {
  await connectToDatabase();

  const tokenAddress = process.env.NEXT_PUBLIC_DEX_TOKEN_ADDRESS?.trim();
  if (!tokenAddress) return null;

  const doc = await TokenMarketSnapshot.findOne({ tokenAddress })
    .sort({ fetchedAt: -1 })
    .lean()
    .exec();

  if (!doc) return null;

  return {
    priceUsd: doc.priceUsd,
    volume24h: doc.volume24h,
    marketCap: doc.marketCap,
    fdv: doc.fdv,
    liquidityUsd: doc.liquidityUsd,
    priceChange24h: doc.priceChange24h,
    txnsBuys24h: doc.txnsBuys24h,
    txnsSells24h: doc.txnsSells24h,
    pairAddress: doc.pairAddress,
    dexId: doc.dexId,
    fetchedAt: doc.fetchedAt,
  };
}
