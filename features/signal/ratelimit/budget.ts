import { SlidingWindowBucket } from "./bucket";

export type DexEndpoint =
  | "community-takeovers"
  | "token-pairs"
  | "tokens"
  | "metas"
  | "search"
  | "token-profiles"
  | "token-boosts"
  | "ads"
  | "orders";

export const DEX_ENDPOINTS: DexEndpoint[] = [
  "community-takeovers",
  "token-pairs",
  "tokens",
  "metas",
  "search",
  "token-profiles",
  "token-boosts",
  "ads",
  "orders",
];

export type RatePriority = "background" | "user";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const WINDOW_MS = 60_000;

export class DexRateBudget {
  readonly windowMs = WINDOW_MS;
  capacityPerEndpoint: number;
  globalCap: number;
  reservation: number;

  private endpoints = new Map<
    DexEndpoint,
    { background: SlidingWindowBucket; user: SlidingWindowBucket }
  >();
  private globalBackground = new SlidingWindowBucket(WINDOW_MS, 1);
  private globalUser = new SlidingWindowBucket(WINDOW_MS, 1);

  constructor(
    capacityPerEndpoint = num(process.env.DEX_REST_RATE_PER_MIN, 60),
    globalCap = num(process.env.DEX_GLOBAL_RATE_PER_MIN, 55),
    reservation = num(process.env.DEX_INGESTION_RESERVATION_PER_MIN, 20),
  ) {
    this.capacityPerEndpoint = capacityPerEndpoint;
    this.globalCap = globalCap;
    this.reservation = reservation;
    for (const ep of DEX_ENDPOINTS) {
      this.endpoints.set(ep, {
        background: new SlidingWindowBucket(WINDOW_MS, reservation),
        user: new SlidingWindowBucket(WINDOW_MS, capacityPerEndpoint - reservation),
      });
    }
    this.globalBackground.reset(reservation);
    this.globalUser.reset(globalCap - reservation);
  }

  tryClaim(
    endpoint: DexEndpoint,
    priority: RatePriority,
  ): { allowed: true } | { allowed: false; retryAfterSec: number } {
    const counters = this.endpoints.get(endpoint);
    if (!counters) {
      return { allowed: false, retryAfterSec: 0 };
    }

    const bucket = priority === "background" ? counters.background : counters.user;
    const other = priority === "background" ? counters.user : counters.background;
    const slotCap =
      priority === "background"
        ? this.reservation
        : this.capacityPerEndpoint - this.reservation;

    const endpointTotal = bucket.count + other.count;
    if (endpointTotal >= this.capacityPerEndpoint) {
      return { allowed: false, retryAfterSec: Math.ceil(this.windowMs / 1000) };
    }
    if (bucket.count >= slotCap) {
      return { allowed: false, retryAfterSec: Math.ceil(this.windowMs / 1000) };
    }

    const gBucket =
      priority === "background" ? this.globalBackground : this.globalUser;
    const gOther =
      priority === "background" ? this.globalUser : this.globalBackground;
    const gSlotCap =
      priority === "background"
        ? this.reservation
        : this.globalCap - this.reservation;

    const globalTotal = gBucket.count + gOther.count;
    if (globalTotal >= this.globalCap) {
      return { allowed: false, retryAfterSec: Math.ceil(this.windowMs / 1000) };
    }
    if (gBucket.count >= gSlotCap) {
      return { allowed: false, retryAfterSec: Math.ceil(this.windowMs / 1000) };
    }

    bucket.tryAdd();
    gBucket.tryAdd();
    return { allowed: true };
  }

  usage() {
    return {
      capacityPerEndpoint: this.capacityPerEndpoint,
      globalCap: this.globalCap,
      reservation: this.reservation,
      endpoints: Object.fromEntries(
        Array.from(this.endpoints.entries()).map(([ep, c]) => [
          ep,
          {
            total: c.background.count + c.user.count,
            background: c.background.count,
            user: c.user.count,
            remainingBg: c.background.remaining,
            remainingUser: c.user.remaining,
          },
        ]),
      ),
      global: {
        total: this.globalBackground.count + this.globalUser.count,
        background: this.globalBackground.count,
        user: this.globalUser.count,
        remaining: this.globalCap - (this.globalBackground.count + this.globalUser.count),
      },
    };
  }
}

export const dexBudget = new DexRateBudget();

export type ClaimResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export function tryClaimRate(
  endpoint: DexEndpoint,
  priority: RatePriority,
): ClaimResult {
  return dexBudget.tryClaim(endpoint, priority);
}

export class DexRateLimitedError extends Error {
  constructor(
    readonly endpoint: DexEndpoint,
    readonly priority: RatePriority,
    readonly retryAfterSec: number,
  ) {
    super(`DexScreener rate budget exhausted for ${endpoint}.`);
    this.name = "DexRateLimitedError";
  }
}

export async function dexfetch<T>(
  endpoint: DexEndpoint,
  priority: RatePriority,
  input: string | URL | Request,
  init?: RequestInit,
): Promise<T> {
  const claim = tryClaimRate(endpoint, priority);
  if (!claim.allowed) {
    throw new DexRateLimitedError(endpoint, priority, claim.retryAfterSec);
  }

  const res = await fetch(input, init);

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || 60;
    throw new DexRateLimitedError(endpoint, priority, retryAfter);
  }

  if (!res.ok) {
    throw new Error(
      `DexScreener request failed (${endpoint}): ${res.status} ${res.statusText}`,
    );
  }

  return (await res.json()) as T;
}