import Link from "next/link";
import { getTokenPairs } from "@/features/signal/client";
import { DataTable } from "@/features/signal/components/DataTable";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { Pair } from "@/features/signal/client";

export default async function TokenDetailPage({ params, searchParams }: { params: Promise<{ chainId: string; tokenAddress: string }>; searchParams: Promise<{ w?: string }> }) {
  const { chainId, tokenAddress } = await params;
  const { w } = await searchParams;
  const wallet = w ?? "";
  const base = wallet ? `/${wallet}` : "";

  let pairs: Pair[] = []; let error: string | null = null;
  try { pairs = await getTokenPairs(chainId, tokenAddress); } catch (err) { error = err instanceof Error ? err.message : "Failed to load token"; }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Token Pairs</h1>
        <p className="font-mono text-xs text-muted-foreground">{chainId}: {tokenAddress}</p>
      </div>
      {error ? <ErrorState message={error} /> : (
        <DataTable<Pair>
          columns={[
            { key: "dex", header: "DEX", cell: (item) => item.dexId },
            { key: "pair", header: "Pair", cell: (item) => <Link href={`${base}/pairs/${item.chainId}/${item.pairAddress}`} className="text-primary hover:underline">{item.baseToken.symbol}{item.quoteToken.symbol ? ` / ${item.quoteToken.symbol}` : ""}</Link> },
            { key: "price", header: "Price USD", cell: (item) => item.priceUsd ? `$${Number(item.priceUsd).toFixed(8)}` : "—" },
            { key: "volume", header: "Vol 24h", cell: (item) => { const v = item.volume?.h24; return v != null ? `$${v.toLocaleString()}` : "—"; } },
            { key: "liq", header: "Liq USD", cell: (item) => item.liquidity?.usd != null ? `$${item.liquidity.usd.toLocaleString()}` : "—" },
            { key: "change", header: "24h", cell: (item) => { const c = item.priceChange?.h24; if (c == null) return "—"; return <span className={c >= 0 ? "text-green-500" : "text-red-500"}>{c >= 0 ? "+" : ""}{c.toFixed(2)}%</span>; } },
          ]}
          data={pairs} isLoading={false} keyExtractor={(item) => `${item.chainId}-${item.pairAddress}`}
        />
      )}
    </div>
  );
}