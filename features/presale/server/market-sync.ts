import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { getTokenPairs } from "@/features/signal/client/dex";
import { TokenMarketSnapshot } from "../models/TokenMarketSnapshot";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const CHAIN_ID = "solana";

async function fetchAndStore() {
  const tokenAddress = process.env.NEXT_PUBLIC_DEX_TOKEN_ADDRESS?.trim();
  if (!tokenAddress) return;

  try {
    const pairs = await getTokenPairs(CHAIN_ID, tokenAddress);
    if (!Array.isArray(pairs) || pairs.length === 0) return;

    const best = pairs.reduce((a, b) => {
      const volA = Number(a.volume?.h24 ?? 0);
      const volB = Number(b.volume?.h24 ?? 0);
      return volB > volA ? b : a;
    });

    await connectToDatabase();

    await TokenMarketSnapshot.create({
      tokenAddress,
      priceUsd: best.priceUsd ? Number(best.priceUsd) : 0,
      volume24h: best.volume?.h24 ?? 0,
      marketCap: best.marketCap ?? null,
      fdv: best.fdv ?? null,
      liquidityUsd: best.liquidity?.usd ?? null,
      priceChange24h: best.priceChange?.h24 ?? null,
      txnsBuys24h: best.txns?.h24?.buys ?? 0,
      txnsSells24h: best.txns?.h24?.sells ?? 0,
      pairAddress: best.pairAddress ?? "",
      dexId: best.dexId ?? "",
      fetchedAt: new Date(),
    });
  } catch (err) {
    console.error("[market-sync] failed to fetch/store snapshot", err);
  }
}

export function startMarketSync() {
  fetchAndStore();
  const timer = setInterval(fetchAndStore, SYNC_INTERVAL_MS);
  timer.unref?.();
}
