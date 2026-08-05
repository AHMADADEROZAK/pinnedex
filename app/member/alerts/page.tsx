import Link from "next/link";
import { FilePen, Handshake, Megaphone, Rocket } from "lucide-react";

import { connectToDatabase } from "@/lib/mongodb";
import { hasActiveMembership, DexEvent } from "@/features/signal";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState } from "@/features/signal/components/ErrorState";
import {
  AlertRow,
  type AlertItem,
} from "@/features/signal/components/AlertRow";
import type { DexEventDocument, DexEventType } from "@/features/signal";

const TYPE_OPTIONS: DexEventType[] = [
  "token-profile",
  "community-takeover",
  "boost",
  "ad",
];

const TYPE_LABELS: Record<string, string> = {
  "token-profile": "Profiles",
  "community-takeover": "Takeovers",
  boost: "Boosts",
  ad: "Ads",
};

const LEGEND: { type: DexEventType; label: string; icon: React.ReactNode }[] = [
  { type: "boost", label: "Boost", icon: <Rocket className="size-3.5" /> },
  {
    type: "community-takeover",
    label: "Takeover",
    icon: <Handshake className="size-3.5" />,
  },
  {
    type: "token-profile",
    label: "Profile",
    icon: <FilePen className="size-3.5" />,
  },
  { type: "ad", label: "Ad", icon: <Megaphone className="size-3.5" /> },
];

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; chain?: string; w?: string }>;
}) {
  const { type, chain, w } = await searchParams;
  const wallet = w ?? "";
  const active = await hasActiveMembership();
  const limit = active ? 200 : 50;
  let events: DexEventDocument[] = [];
  let error: string | null = null;
  try {
    await connectToDatabase();
    events = (await DexEvent.find()
      .sort({ seenAt: -1 })
      .limit(limit)
      .lean()
      .exec()) as unknown as DexEventDocument[];
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load alerts";
  }

  const typeFiltered = type ? events.filter((e) => e.type === type) : events;
  const filtered = chain ? typeFiltered.filter((e) => e.chainId === chain) : typeFiltered;

  const chains = Array.from(new Set(events.map((e) => e.chainId))).sort();

  const items: AlertItem[] = filtered.map((item) => ({
    id: String(item._id),
    type: item.type,
    chainId: item.chainId,
    tokenAddress: item.tokenAddress,
    payload: (item.payload ?? {}) as Record<string, unknown>,
    seenAt:
      item.seenAt instanceof Date
        ? item.seenAt.toISOString()
        : String(item.seenAt),
  }));

  const base = wallet ? `/${wallet}` : "";

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Alerts
        </h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} recent events
          {!active && " (free tier: last 50)"}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
          {LEGEND.map((l) => (
            <span
              key={l.type}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              {l.icon}
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1">
          <Link
            href={`${base}/alerts${chain ? `?chain=${chain}` : ""}`}
            data-active={!type || undefined}
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all data-active:bg-primary data-active:text-primary-foreground data-active:border-primary hover:bg-muted"
          >
            All
          </Link>
          {TYPE_OPTIONS.map((t) => (
            <Link
              key={t}
              href={`${base}/alerts?${type === t ? "" : `type=${t}`}${chain ? (type === t ? "" : "&") + `chain=${chain}` : ""}`}
              data-active={type === t || undefined}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all data-active:bg-primary data-active:text-primary-foreground data-active:border-primary hover:bg-muted"
            >
              {TYPE_LABELS[t] ?? t}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          <Link
            href={`${base}/alerts${type ? `?type=${type}` : ""}`}
            data-active={!chain || undefined}
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all data-active:bg-primary data-active:text-primary-foreground data-active:border-primary hover:bg-muted"
          >
            All chains
          </Link>
          {chains.map((ch) => (
            <Link
              key={ch}
              href={`${base}/alerts?${type ? `type=${type}&` : ""}chain=${ch}`}
              data-active={chain === ch || undefined}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all data-active:bg-primary data-active:text-primary-foreground data-active:border-primary hover:bg-muted"
            >
              {ch}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No alerts yet</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Type</TableHead>
                <TableHead className="w-20">Chain</TableHead>
                <TableHead>Token</TableHead>
                <TableHead className="w-40">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <AlertRow key={item.id} item={item} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}