import { tryClaimRate, dexBudget } from "./budget";
import type { DexEndpoint, RatePriority } from "./budget";

const DEFAULT_MAX_WAIT_MS = 60_000;
const DEFAULT_POLL_MS = 1_000;

export interface WithRateSlotsOptions {
  maxWaitMs?: number;
  pollMs?: number;
  budget?: typeof dexBudget;
}

/**
 * Awaits until a rate slot is available for the given endpoint/priority,
 * returning true if granted within the timeout, false on timeout.
 */
export function waitForRateSlots(
  endpoint: DexEndpoint,
  priority: RatePriority = "background",
  {
    maxWaitMs = DEFAULT_MAX_WAIT_MS,
    pollMs = DEFAULT_POLL_MS,
  }: WithRateSlotsOptions = {},
): Promise<boolean> {
  return new Promise((resolve) => {
    const started = Date.now();

    const attempt = () => {
      const claim = tryClaimRate(endpoint, priority);
      if (claim.allowed) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= maxWaitMs) {
        resolve(false);
        return;
      }
      setTimeout(attempt, pollMs);
    };

    attempt();
  });
}

export async function withRateSlots<T>(
  endpoint: DexEndpoint,
  priority: RatePriority,
  fn: () => Promise<T>,
  options?: WithRateSlotsOptions,
): Promise<T | undefined> {
  const granted = await waitForRateSlots(endpoint, priority, options);
  if (!granted) {
    return undefined;
  }
  return fn();
}