import Link from "next/link";
import { getPair } from "@/features/signal/client";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { Pair } from "@/features/signal/client";

const tf = ["m5", "h1", "h6", "h24"] as const;

export default async function PairDetailPage({ params, searchParams }: { params: Promise<{ chainId: string; pairId: string }>; searchParams: Promise<{ w?: string }> }) {
  const { chainId, pairId } = await params;
  const { w } = await searchParams;
  const wallet = w ?? "";
  const base = wallet ? `/${wallet}` : "";

  let pair: Pair | null = null; let error: string | null = null;
  try { pair = await getPair(chainId, pairId); } catch (err) { error = err instanceof Error ? err.message : "Failed to load pair"; }

  if (error) return <div className="flex flex-col gap-6 text-sm leading-loose"><ErrorState message={error} /></div>;
  if (!pair) return <div className="flex flex-col gap-6 text-sm leading-loose"><p className="text-muted-foreground">Pair not found.</p></div>;

  const priceUsd = pair.priceUsd ? `$${Number(pair.priceUsd).toFixed(8)}` : "—";

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div>
        <Link href={`${base}/tokens/${pair.chainId}/${pair.baseToken.address}`} className="text-xs text-primary hover:underline">&larr; {pair.baseToken.symbol}</Link>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{pair.baseToken.symbol}{pair.quoteToken.symbol ? ` / ${pair.quoteToken.symbol}` : ""}</h1>
        <span className="text-xs text-muted-foreground">{pair.dexId} — {pair.chainId}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4"><span className="text-xs text-muted-foreground">Price USD</span><div className="font-mono text-lg font-bold">{priceUsd}</div></div>
        <div className="rounded-lg border p-4"><span className="text-xs text-muted-foreground">Price Native</span><div className="font-mono text-lg font-bold">{pair.priceNative}</div></div>
        <div className="rounded-lg border p-4"><span className="text-xs text-muted-foreground">FDV</span><div className="font-mono text-lg font-bold">{pair.fdv != null ? `$${pair.fdv.toLocaleString()}` : "—"}</div></div>
        <div className="rounded-lg border p-4"><span className="text-xs text-muted-foreground">Market Cap</span><div className="font-mono text-lg font-bold">{pair.marketCap != null ? `$${pair.marketCap.toLocaleString()}` : "—"}</div></div>
      </div>

      <div><h3 className="mb-2 font-heading text-base font-semibold">Price Change</h3>
        <table className="w-full text-left text-sm"><thead><tr className="border-b">{tf.map((k) => <th key={k} className="px-2 py-1 font-medium">{k}</th>)}</tr></thead><tbody><tr>{tf.map((k) => { const v = pair.priceChange?.[k]; return <td key={k} className="px-2 py-1 font-mono">{v != null ? <span className={v >= 0 ? "text-green-500" : "text-red-500"}>{v >= 0 ? "+" : ""}{v.toFixed(2)}%</span> : "—"}</td>; })}</tr></tbody></table></div>
      <div><h3 className="mb-2 font-heading text-base font-semibold">Volume</h3>
        <table className="w-full text-left text-sm"><thead><tr className="border-b">{tf.map((k) => <th key={k} className="px-2 py-1 font-medium">{k}</th>)}</tr></thead><tbody><tr>{tf.map((k) => { const v = pair.volume?.[k]; return <td key={k} className="px-2 py-1 font-mono">{v != null ? `$${v.toLocaleString()}` : "—"}</td>; })}</tr></tbody></table></div>
      <div><h3 className="mb-2 font-heading text-base font-semibold">Transactions (Buys / Sells)</h3>
        <table className="w-full text-left text-sm"><thead><tr className="border-b">{tf.map((k) => <th key={k} className="px-2 py-1 font-medium">{k}</th>)}</tr></thead><tbody><tr>{tf.map((k) => { const tx = pair.txns?.[k]; return <td key={k} className="px-2 py-1 font-mono">{tx ? `${tx.buys} / ${tx.sells}` : "—"}</td>; })}</tr></tbody></table></div>

      {pair.liquidity && <div className="flex gap-4"><div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Liquidity USD</span><div className="font-mono font-bold">{pair.liquidity.usd != null ? `$${pair.liquidity.usd.toLocaleString()}` : "—"}</div></div><div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Base</span><div className="font-mono font-bold">{pair.liquidity.base.toLocaleString()}</div></div><div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Quote</span><div className="font-mono font-bold">{pair.liquidity.quote.toLocaleString()}</div></div></div>}
      {pair.boosts && <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Active Boosts</span><div className="font-mono font-bold">{pair.boosts.active}</div></div>}
      {pair.pairCreatedAt && <p className="text-xs text-muted-foreground">Created: {new Date(pair.pairCreatedAt).toLocaleString()}</p>}
      <a href={pair.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View on DexScreener &rarr;</a>
    </div>
  );
}