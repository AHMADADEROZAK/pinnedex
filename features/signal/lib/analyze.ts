import "server-only";

import type { Pair, Meta } from "@/features/signal/client";
import { searchPairs } from "@/features/signal/client";

export interface WhaleSignal {
  chainId: string;
  tokenAddress: string;
  baseSymbol: string;
  signal: "volume-spike" | "buy-pressure" | "sell-pressure" | "liq-jump";
  score: number;
  detail: string;
}

const SOLANA = "solana";

function parseH1Volume(pair: Pair): number {
  return pair.volume?.h1 ?? 0;
}

function parseM5Txns(pair: Pair): { buys: number; sells: number } {
  return pair.txns?.m5 ?? { buys: 0, sells: 0 };
}

function parsePriceChange(pair: Pair, key: string): number {
  return pair.priceChange?.[key] ?? 0;
}

export function detectWhaleSignals(pairs: Pair[]): WhaleSignal[] {
  const signals: WhaleSignal[] = [];

  for (const pair of pairs) {
    const h1Vol = parseH1Volume(pair);
    const m5 = parseM5Txns(pair);
    const pcH1 = parsePriceChange(pair, "h1");
    const liqUsd = pair.liquidity?.usd ?? 0;

    if (h1Vol > 10_000 && m5.buys / Math.max(m5.sells, 1) > 2) {
      signals.push({
        chainId: pair.chainId,
        tokenAddress: pair.baseToken.address,
        baseSymbol: pair.baseToken.symbol,
        signal: "buy-pressure",
        score: Math.round((m5.buys / Math.max(m5.sells, 1)) * 10),
        detail: `${m5.buys} buys / ${m5.sells} sells (m5), vol $${h1Vol.toLocaleString()} (h1)`,
      });
    }

    if (h1Vol > 10_000 && m5.sells / Math.max(m5.buys, 1) > 2) {
      signals.push({
        chainId: pair.chainId,
        tokenAddress: pair.baseToken.address,
        baseSymbol: pair.baseToken.symbol,
        signal: "sell-pressure",
        score: Math.round((m5.sells / Math.max(m5.buys, 1)) * 8),
        detail: `${m5.sells} sells / ${m5.buys} buys (m5), vol $${h1Vol.toLocaleString()} (h1)`,
      });
    }

    if (Math.abs(pcH1) > 15 && liqUsd > 5_000) {
      signals.push({
        chainId: pair.chainId,
        tokenAddress: pair.baseToken.address,
        baseSymbol: pair.baseToken.symbol,
        signal: pcH1 > 0 ? "volume-spike" : "sell-pressure",
        score: Math.round(Math.abs(pcH1) / 3),
        detail: `${pcH1 > 0 ? "+" : ""}${pcH1.toFixed(1)}% (h1), liq $${liqUsd.toLocaleString()}`,
      });
    }
  }

  return signals.sort((a, b) => b.score - a.score).slice(0, 20);
}

export interface RadarToken {
  address: string;
  symbol: string;
  name: string;
  marketCap: number | null;
  priceChange24h: number | null;
  volume24h: number;
}

export async function getRobinhoodRadar(): Promise<RadarToken[]> {
  try {
    const results = await searchPairs("sol");
    const solanaPairs = results.filter((p) => p.chainId === SOLANA);

    return solanaPairs
      .filter((p) => {
        const liqUsd = p.liquidity?.usd ?? 0;
        const volH24 = p.volume?.h24 ?? 0;
        return liqUsd > 10_000 && volH24 > 50_000;
      })
      .map((p) => ({
        address: p.baseToken.address,
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        marketCap: p.marketCap,
        priceChange24h: p.priceChange?.h24 ?? null,
        volume24h: p.volume?.h24 ?? 0,
      }))
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 20);
  } catch {
    return [];
  }
}

export function filterMetasSolana(metas: Meta[]): Meta[] {
  return metas.filter((m) =>
    m.description?.toLowerCase().includes("solana") ||
    m.name?.toLowerCase().includes("solana") ||
    m.slug?.toLowerCase().includes("solana"),
  );
}