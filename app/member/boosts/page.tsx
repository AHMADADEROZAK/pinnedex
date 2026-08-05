import Link from "next/link";

import { getLatestBoosts, getTopBoosts } from "@/features/signal/client";
import type { Boost } from "@/features/signal/client";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BoostRow } from "@/features/signal/components/BoostRow";

export default async function BoostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; chain?: string; w?: string }>;
}) {
  const { tab, chain, w } = await searchParams;
  const wallet = w ?? "";
  const isTop = tab === "top";

  let all: Boost[] = [];
  try {
    all = isTop ? await getTopBoosts() : await getLatestBoosts();
  } catch {
    // fall through
  }

  const chains = Array.from(new Set(all.map((b) => b.chainId))).sort();
  const filtered = chain ? all.filter((b) => b.chainId === chain) : all;
  const seen = new Set<string>();
  const unique = filtered.filter((b) => {
    if (seen.has(b.tokenAddress)) return false;
    seen.add(b.tokenAddress);
    return true;
  });

  const base = wallet ? `/${wallet}` : "";

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Token Boosts
        </h1>
        <p className="text-sm text-muted-foreground">
          {unique.length} unique tokens
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-9 items-center gap-1 rounded-4xl bg-muted p-[3px] text-muted-foreground">
          <Link
            href={`${base}/boosts`}
            data-active={!isTop || undefined}
            className="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all hover:text-foreground data-active:bg-background data-active:text-foreground"
          >
            Latest
          </Link>
          <Link
            href={`${base}/boosts?tab=top`}
            data-active={isTop || undefined}
            className="relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all hover:text-foreground data-active:bg-background data-active:text-foreground"
          >
            Top
          </Link>
        </div>

        <div className="flex flex-wrap gap-1">
          <Link
            href={`${base}/boosts${isTop ? "?tab=top" : ""}`}
            data-active={!chain || undefined}
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all data-active:bg-primary data-active:text-primary-foreground data-active:border-primary hover:bg-muted"
          >
            All
          </Link>
          {chains.map((ch) => (
            <Link
              key={ch}
              href={`${base}/boosts?${isTop ? "tab=top&" : ""}chain=${ch}`}
              data-active={chain === ch || undefined}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all data-active:bg-primary data-active:text-primary-foreground data-active:border-primary hover:bg-muted"
            >
              {ch}
            </Link>
          ))}
        </div>
      </div>

      {unique.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No token boosts available
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Chain</TableHead>
                <TableHead>Token</TableHead>
                <TableHead className="w-20">Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-40">Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unique.map((boost) => (
                <BoostRow
                  key={`${boost.tokenAddress}-${boost.chainId}`}
                  boost={boost}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}