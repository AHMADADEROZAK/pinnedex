import { getTrendingMetas } from "@/features/signal/client";
import { DataCard } from "@/features/signal/components/DataCard";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { Meta } from "@/features/signal/client";

function fmt(n: number) { if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`; if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`; return `$${n.toFixed(2)}`; }
function pct(v: number) { const s = v >= 0 ? "+" : ""; return `${s}${v.toFixed(1)}%`; }

export default async function MetasPage() {
  let data: Meta[] = []; let error: string | null = null;
  try { data = await getTrendingMetas(); } catch (err) { error = err instanceof Error ? err.message : "Failed to load metas"; }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Trending Metas</h1>
      {error ? <ErrorState message={error} /> : data.length === 0 ? <p className="text-muted-foreground">No trending metas.</p> : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((m) => (
            <DataCard key={m.slug} title={m.name} value={fmt(m.marketCap)} description={`${m.tokenCount} tokens | Vol ${fmt(m.volume)} | Liq ${fmt(m.liquidity)} | 24h ${pct(m.marketCapChange.h24)}`} />
          ))}
        </div>
      )}
    </div>
  );
}