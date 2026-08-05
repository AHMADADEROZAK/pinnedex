import Link from "next/link";
import { searchPairs } from "@/features/signal/client";
import { SearchForm } from "@/features/signal/components/SearchForm";
import { DataTable } from "@/features/signal/components/DataTable";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { Pair } from "@/features/signal/client";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; w?: string }> }) {
  const { q, w } = await searchParams;
  const wallet = w ?? "";
  const base = wallet ? `/${wallet}` : "";

  let results: Pair[] | undefined; let error: string | null = null;
  if (q) {
    try { results = await searchPairs(q); } catch (err) { error = err instanceof Error ? err.message : "Search failed"; }
  }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Search Pairs</h1>
      <SearchForm wallet={wallet} />
      {error ? <ErrorState message={error} /> : results !== undefined && results.length === 0 ? <p className="text-muted-foreground">No results for &quot;{q}&quot;.</p> : results && results.length > 0 ? (
        <DataTable<Pair>
          columns={[
            { key: "pair", header: "Pair", cell: (item) => <Link href={`${base}/pairs/${item.chainId}/${item.pairAddress}`} className="text-primary hover:underline">{item.baseToken.symbol}{item.quoteToken.symbol ? ` / ${item.quoteToken.symbol}` : ""}</Link> },
            { key: "dex", header: "DEX", cell: (item) => item.dexId },
            { key: "price", header: "Price", cell: (item) => item.priceUsd ? `$${Number(item.priceUsd).toFixed(6)}` : "—" },
            { key: "volume", header: "Volume 24h", cell: (item) => { const v = item.volume?.h24; return v != null ? `$${v.toLocaleString()}` : "—"; } },
            { key: "change", header: "24h", cell: (item) => { const c = item.priceChange?.h24; if (c == null) return "—"; return <span className={c >= 0 ? "text-green-500" : "text-red-500"}>{c >= 0 ? "+" : ""}{c.toFixed(2)}%</span>; } },
          ]}
          data={results} isLoading={false} keyExtractor={(item) => `${item.chainId}-${item.pairAddress}`}
        />
      ) : null}
    </div>
  );
}