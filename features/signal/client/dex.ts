import "server-only";

import { dexfetch } from "@/features/signal/ratelimit";
import type { DexEndpoint } from "@/features/signal/ratelimit";
import { TtlCache } from "@/features/signal/client/cache";
import type {
  Ad,
  Boost,
  CommunityTakeover,
  Meta,
  MetaWithPairs,
  Pair,
  TokenProfile,
  TokenWithPairs,
} from "@/features/signal/client/types";

const BASE_URL = "https://api.dexscreener.com";

const cache = new TtlCache<string, unknown>();

async function cachedFetch<T>(
  endpoint: DexEndpoint,
  path: string,
): Promise<T> {
  const cached = cache.get<T>(path);
  if (cached !== undefined) return cached;

  const data = await dexfetch<T>(endpoint, "user", `${BASE_URL}${path}`, {
    cache: "no-store",
  });
  cache.set(path, data);
  return data;
}

export function getLatestTokenProfiles(): Promise<TokenProfile[]> {
  return cachedFetch<TokenProfile[]>("token-profiles", "/token-profiles/latest/v1");
}

export function getRecentTokenProfileUpdates(): Promise<TokenProfile[]> {
  return cachedFetch<TokenProfile[]>(
    "token-profiles",
    "/token-profiles/recent-updates/v1",
  );
}

export function getLatestCommunityTakeovers(): Promise<CommunityTakeover[]> {
  return cachedFetch<CommunityTakeover[]>(
    "community-takeovers",
    "/community-takeovers/latest/v1",
  );
}

export function getLatestAds(): Promise<Ad[]> {
  return cachedFetch<Ad[]>("ads", "/ads/latest/v1");
}

export function getLatestBoosts(): Promise<Boost[]> {
  return cachedFetch<Boost[]>("token-boosts", "/token-boosts/latest/v1");
}

export function getTopBoosts(): Promise<Boost[]> {
  return cachedFetch<Boost[]>("token-boosts", "/token-boosts/top/v1");
}

export function getTrendingMetas(): Promise<Meta[]> {
  return cachedFetch<Meta[]>("metas", "/metas/trending/v1");
}

export function getMetaBySlug(slug: string): Promise<MetaWithPairs> {
  return cachedFetch<MetaWithPairs>(
    "metas",
    `/metas/meta/v1/${encodeURIComponent(slug)}`,
  );
}

export function getTokenPairs(
  chainId: string,
  tokenAddress: string,
): Promise<Pair[]> {
  return cachedFetch<Pair[]>(
    "token-pairs",
    `/token-pairs/v1/${chainId}/${tokenAddress}`,
  );
}

export function getTokens(
  chainId: string,
  tokenAddresses: string[],
): Promise<TokenWithPairs[]> {
  return cachedFetch<TokenWithPairs[]>(
    "tokens",
    `/tokens/v1/${chainId}/${tokenAddresses.slice(0, 30).join(",")}`,
  );
}

export function searchPairs(query: string): Promise<Pair[]> {
  return cachedFetch<{ pairs?: Pair[] }>(
    "search",
    `/latest/dex/search?q=${encodeURIComponent(query)}`,
  ).then((res) => res.pairs ?? []);
}

export function getPair(chainId: string, pairId: string): Promise<Pair> {
  return cachedFetch<{ pairs?: Pair[] }>(
    "token-pairs",
    `/latest/dex/pairs/${chainId}/${pairId}`,
  ).then((res) => {
    const pair = res.pairs?.[0];
    if (!pair) throw new Error(`Pair not found: ${chainId}/${pairId}`);
    return pair;
  });
}