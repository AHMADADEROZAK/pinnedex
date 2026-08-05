import { getTokens } from "@/features/signal/client/dex";

export interface TokenMarket {
  symbol?: string;
  name?: string;
  priceUsd?: number;
  volume24h?: number;
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
}

export type MarketIndex = Record<string, TokenMarket>;

interface MarketSource {
  chainId: string;
  tokenAddress?: string;
}

export async function fetchMarketIndex(
  sources: MarketSource[],
): Promise<MarketIndex> {
  const byChain = new Map<string, string[]>();
  for (const e of sources) {
    if (!e.tokenAddress) continue;
    const list = byChain.get(e.chainId) ?? [];
    if (!list.includes(e.tokenAddress) && list.length < 30) {
      list.push(e.tokenAddress);
    }
    byChain.set(e.chainId, list);
  }

  const index: MarketIndex = {};
  await Promise.all(
    Array.from(byChain.entries()).map(async ([chain, addresses]) => {
      try {
        const pairs = await getTokens(chain, addresses);
        if (!Array.isArray(pairs)) return;
        for (const pair of pairs) {
          if (!pair?.baseToken?.address) continue;
          const address = pair.baseToken.address.toLowerCase();
          const current = index[address];
          if (
            !current ||
            Number(pair.volume?.h24 ?? 0) > Number(current.volume24h ?? 0)
          ) {
            index[address] = {
              symbol: pair.baseToken.symbol,
              name: pair.baseToken.name,
              priceUsd: pair.priceUsd ? Number(pair.priceUsd) : undefined,
              volume24h: pair.volume?.h24,
              marketCap: pair.marketCap ?? undefined,
              fdv: pair.fdv ?? undefined,
              pairCreatedAt: pair.pairCreatedAt ?? undefined,
            };
          }
        }
      } catch {
        // dex fetch failed for this chain; leave unenriched
      }
    }),
  );
  return index;
}