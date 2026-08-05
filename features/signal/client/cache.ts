import "server-only";

import { num } from "@/features/signal/lib/num";

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<K, V> {
  private store = new Map<string, Entry<V>>();
  private ttlMs: number;

  constructor(ttlMs = num(process.env.DEX_CACHE_TTL_MS, 15_000)) {
    this.ttlMs = ttlMs;
  }

  get<KOut = V>(key: K): KOut | undefined {
    const hit = this.store.get(String(key));
    if (!hit) return undefined;
    if (Date.now() >= hit.expiresAt) {
      this.store.delete(String(key));
      return undefined;
    }
    return hit.value as unknown as KOut;
  }

  set(key: K, value: V): void {
    this.store.set(String(key), {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
    if (Date.now() % 1_000 === 0) this.prune();
  }

  private prune(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now >= v.expiresAt) this.store.delete(k);
    }
  }

  clear(): void {
    this.store.clear();
  }
}