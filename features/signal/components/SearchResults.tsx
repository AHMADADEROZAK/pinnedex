"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DexScreener } from "@/features/signal/components/DexScreener";
import { BrandOrLink } from "@/features/signal/components/brands";
import type { Pair, TokenProfile } from "@/features/signal/client";

function toIconUrl(icon: string) {
  if (!icon) return "";
  if (icon.startsWith("http")) return icon;
  return `https://cdn.dexscreener.com/cms/images/${icon}?width=64&height=64&fit=crop&quality=95&format=auto`;
}

function pairIcon(pair: Pair, profile: TokenProfile | undefined): string {
  const raw = profile?.icon ?? pair.info?.imageUrl ?? "";
  return raw ? toIconUrl(String(raw)) : "";
}

export function SearchResults({
  results,
  profiles,
  wallet,
}: {
  results: Pair[];
  profiles: Record<string, TokenProfile>;
  wallet: string;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const base = wallet ? `/${wallet}` : "";

  function toggle(pair: Pair) {
    const key = `${pair.chainId}-${pair.pairAddress}`;
    setExpanded((cur) => (cur === key ? null : key));
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Pair</TableHead>
            <TableHead>DEX</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Volume 24h</TableHead>
            <TableHead>24h</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((pair) => {
            const key = `${pair.chainId}-${pair.pairAddress}`;
            const isOpen = expanded === key;
            const profile = profiles[pair.baseToken.address?.toLowerCase() ?? ""];
            return (
              <ResultRow
                key={key}
                pair={pair}
                profile={profile}
                open={isOpen}
                base={base}
                onToggle={() => toggle(pair)}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ResultRow({
  pair,
  profile,
  open,
  base,
  onToggle,
}: {
  pair: Pair;
  profile: TokenProfile | undefined;
  open: boolean;
  base: string;
  onToggle: () => void;
}) {
  const priceChange = pair.priceChange?.h24;
  const volume = pair.volume?.h24;

  return (
    <>
      <TableRow data-state={open ? "selected" : undefined}>
        <TableCell>
          <button
            onClick={onToggle}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title={open ? "Collapse" : "Expand"}
            aria-expanded={open}
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {profile?.header && (
              <img
                src={String(profile.header)}
                alt=""
                className="hidden h-10 w-14 shrink-0 rounded object-cover sm:block"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            {pairIcon(pair, profile) && (
              <img
                src={pairIcon(pair, profile)}
                alt=""
                className="size-6 shrink-0 rounded-full bg-muted object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex min-w-0 flex-col">
              <span className="font-medium">
                {pair.baseToken.symbol}
                {pair.quoteToken.symbol ? ` / ${pair.quoteToken.symbol}` : ""}
              </span>
              <span className="line-clamp-1 max-w-[260px] text-[11px] text-muted-foreground">
                {profile?.description || "—"}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-xs text-muted-foreground">{pair.dexId}</span>
        </TableCell>
        <TableCell className="font-mono text-xs">
          {pair.priceUsd ? `$${Number(pair.priceUsd).toFixed(6)}` : "—"}
        </TableCell>
        <TableCell className="font-mono text-xs">
          {volume != null ? `$${volume.toLocaleString()}` : "—"}
        </TableCell>
        <TableCell>
          {priceChange != null ? (
            <span className={priceChange >= 0 ? "text-green-500" : "text-red-500"}>
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          ) : (
            "—"
          )}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/30">
            <ResultDetail pair={pair} profile={profile} base={base} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ResultDetail({
  pair,
  profile,
  base,
}: {
  pair: Pair;
  profile: TokenProfile | undefined;
  base: string;
}) {
  const [copied, setCopied] = useState(false);
  const icon = profile?.icon ?? pair.info?.imageUrl ?? "";
  const header = profile?.header ?? "";
  const description = profile?.description ?? "";
  const links =
    profile?.links ??
    pair.info?.websites?.map((ws) => ({
      type: "website" as const,
      label: null,
      url: ws.url,
    })) ??
    [];

  function handleCopy() {
    navigator.clipboard.writeText(pair.baseToken.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-col gap-4 p-3 md:flex-row md:items-start">
      {header && (
        <img
          src={header}
          alt=""
          className="aspect-video w-full rounded-md object-cover brightness-90 md:w-56"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/10 to-muted ring-2 ring-card">
              <img
                src={toIconUrl(String(icon))}
                alt=""
                className="size-7 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex min-w-0 items-center gap-1">
            <span className="font-mono text-xs">{pair.baseToken.address}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Copy address"
            >
              {copied ? (
                <span className="text-[9px] text-green-500">Copied!</span>
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {pair.chainId}
          </Badge>
        </div>

        {description && (
          <p className="line-clamp-3 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1">
          {Array.isArray(links) &&
            links.map((link, i) => (
              <BrandOrLink key={i} type={link.type ?? null} url={link.url} />
            ))}
          <DexScreener href={pair.url} />
          <Link
            href={`${base}/pairs/${pair.chainId}/${pair.pairAddress}`}
            className="ml-auto text-xs text-primary hover:underline"
          >
            View detail →
          </Link>
        </div>
      </div>
    </div>
  );
}