import { detectWhaleSignals, getRobinhoodRadar } from "@/features/signal";
import { searchPairs } from "@/features/signal/client";
import type { WhaleSignal, RadarToken } from "@/features/signal";

const SOLANA = "solana";

function fmtUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPct(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function pctColor(v: number): string {
  return v >= 0 ? "text-green-500" : "text-red-500";
}

async function fetchWhaleSignals(): Promise<WhaleSignal[]> {
  try {
    const pairs = await searchPairs("sol");
    return detectWhaleSignals(pairs.filter((p) => p.chainId === SOLANA));
  } catch {
    return [];
  }
}

async function fetchRadar(): Promise<RadarToken[]> {
  try {
    return await getRobinhoodRadar();
  } catch {
    return [];
  }
}

export default async function SignalsPage() {
  const [whaleSignals, radar] = await Promise.all([
    fetchWhaleSignals(),
    fetchRadar(),
  ]);

  return (
    <div className="flex flex-col gap-8 text-sm leading-loose">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Signals
        </h1>
        <p className="text-sm text-muted-foreground">
          Whale detection and Robinhood radar for Solana traders.
        </p>
      </div>

      <section>
        <h2 className="font-heading mb-3 text-lg font-semibold tracking-tight">
          Whale Detector
        </h2>
        {whaleSignals.length === 0 ? (
          <p className="text-muted-foreground">
            No whale signals detected. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {whaleSignals.map((s, i) => (
              <div
                key={`${s.tokenAddress}-${i}`}
                className="rounded-lg border bg-card p-4 text-card-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.tokenAddress.slice(0, 6)}...
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                    {s.signal}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    score {s.score}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">{s.detail}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading mb-3 text-lg font-semibold tracking-tight">
          Robinhood Radar
        </h2>
        {radar.length === 0 ? (
          <p className="text-muted-foreground">No radar tokens detected.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {radar.map((r) => (
              <div
                key={r.address}
                className="rounded-lg border bg-card p-4 text-card-foreground"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.symbol}</span>
                  <span className="text-muted-foreground">{r.name}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span>MCap</span>
                  <span className="text-right font-mono">
                    {r.marketCap != null ? fmtUsd(r.marketCap) : "—"}
                  </span>
                  <span>24h Vol</span>
                  <span className="text-right font-mono">
                    {fmtUsd(r.volume24h)}
                  </span>
                  <span className="col-span-2">
                    24h:{" "}
                    <span
                      className={
                        r.priceChange24h != null ? pctColor(r.priceChange24h) : ""
                      }
                    >
                      {r.priceChange24h != null
                        ? fmtPct(r.priceChange24h)
                        : "—"}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
