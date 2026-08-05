export interface TokenLink {
  type: string | null;
  label: string | null;
  url: string;
}

export interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon: string;
  header: string | null;
  description: string | null;
  links: TokenLink[] | null;
}

export interface CommunityTakeover extends TokenProfile {
  claimDate: string;
}

export interface Ad {
  url: string;
  chainId: string;
  tokenAddress: string;
  date: string;
  type: string;
  durationHours: number | null;
  impressions: number | null;
}

export interface Boost extends TokenProfile {
  amount?: number;
  totalAmount?: number;
}

export interface TimeframeStats {
  m5: number;
  h1: number;
  h6: number;
  h24: number;
}

export interface Meta {
  description: string;
  icon: { type: string; value: string } | null;
  name: string;
  slug: string;
  marketCap: number;
  liquidity: number;
  volume: number;
  tokenCount: number;
  marketCapChange: TimeframeStats;
  marketCapDelta: TimeframeStats;
}

export interface BaseToken {
  address: string;
  name: string;
  symbol: string;
}

export interface QuoteToken {
  address: string | null;
  name: string | null;
  symbol: string | null;
}

export interface PairInfo {
  imageUrl: string | null;
  websites: { url: string }[] | null;
  socials: { platform: string; handle: string }[] | null;
}

export interface Pair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: string[] | null;
  baseToken: BaseToken;
  quoteToken: QuoteToken;
  priceNative: string;
  priceUsd: string | null;
  txns: Record<string, { buys: number; sells: number }>;
  volume: Record<string, number>;
  priceChange: Record<string, number> | null;
  liquidity: { usd: number | null; base: number; quote: number } | null;
  fdv: number | null;
  marketCap: number | null;
  pairCreatedAt: number | null;
  info: PairInfo | null;
  boosts: { active: number } | null;
}

export interface TokenWithPairs {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  labels: string[] | null;
  baseToken: BaseToken;
  quoteToken: QuoteToken;
  priceNative: string;
  priceUsd: string | null;
  txns: Record<string, { buys: number; sells: number }>;
  volume: Record<string, number>;
  priceChange: Record<string, number> | null;
  liquidity: { usd: number | null; base: number; quote: number } | null;
  fdv: number | null;
  marketCap: number | null;
  pairCreatedAt: number | null;
  info: PairInfo | null;
  boosts: { active: number } | null;
}

export interface MetaWithPairs extends Meta {
  pairs: Pair[];
}