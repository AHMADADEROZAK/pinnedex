import Link from "next/link";
import { BarChart3, Bell, Rocket } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { getTrendingMetas } from "@/features/signal/client";
import { DexEvent } from "@/features/signal";
import type { Meta } from "@/features/signal/client";
import { DataCard } from "@/features/signal/components/DataCard";
import { ErrorState } from "@/features/signal/components/ErrorState";
import { SignalDataTable } from "@/features/signal/components/AlertDataTable";
import type { AlertItem } from "@/features/signal/components/AlertRow";
import type { DexEventDocument } from "@/features/signal";
import { fetchMarketIndex } from "@/features/signal/lib/market";
import { Header } from "@/features/app-shell";

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}
function pct(v: number) {
  const s = v >= 0 ? "+" : "";
  return `${s}${v.toFixed(1)}%`;
}

export default async function FreePage() {
  let metas: Meta[] = [];
  let metasError: string | null = null;
  let events: DexEventDocument[] = [];
  let alertsError: string | null = null;

  try {
    metas = await getTrendingMetas();
  } catch (err) {
    metasError = err instanceof Error ? err.message : "Failed to load metas";
  }

  try {
    await connectToDatabase();
    events = (await DexEvent.find()
      .sort({ seenAt: -1 })
      .limit(50)
      .lean()
      .exec()) as unknown as DexEventDocument[];
  } catch (err) {
    alertsError = err instanceof Error ? err.message : "Failed to load alerts";
  }

  const market = await fetchMarketIndex(events);

  const items: AlertItem[] = events.map((item) => ({
    id: String(item._id),
    type: item.type,
    chainId: item.chainId,
    tokenAddress: item.tokenAddress,
    payload: (item.payload ?? {}) as Record<string, unknown>,
    market: market[item.tokenAddress?.toLowerCase() ?? ""]
      ? { ...market[item.tokenAddress.toLowerCase()] }
      : undefined,
    seenAt:
      item.seenAt instanceof Date
        ? item.seenAt.toISOString()
        : String(item.seenAt),
  }));

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 p-6">
        <section className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Free access — no login required
          </span>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Metas & Alerts
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Trending metadata across chains and a live feed of ingest events —
            open to everyone.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Trending Metas
            </h2>
            <Link
              href="/login"
              className="ml-auto text-xs text-muted-foreground hover:text-primary"
            >
              Sign in for full dashboard
            </Link>
          </div>
          {metasError ? (
            <ErrorState message={metasError} />
          ) : metas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trending metas.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {metas.map((m) => (
                <DataCard
                  key={m.slug}
                  title={m.name}
                  value={fmt(m.marketCap)}
                  description={`${m.tokenCount} tokens | Vol ${fmt(m.volume)} | Liq ${fmt(m.liquidity)} | 24h ${pct(m.marketCapChange.h24)}`}
                />
              ))}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              Alerts
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Free tier: last 50
            </span>
          </div>
          {alertsError ? (
            <ErrorState message={alertsError} />
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alerts yet</p>
          ) : (
            <SignalDataTable items={items} showTime />
          )}
          <div className="flex items-center gap-2 rounded-md border bg-card p-4 text-sm">
            <Rocket className="size-4 text-primary" />
            <p className="text-muted-foreground">
              Want 200 events, filters, whale & radar signals and Telegram
              alerts?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>{" "}
              or activate a membership.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
