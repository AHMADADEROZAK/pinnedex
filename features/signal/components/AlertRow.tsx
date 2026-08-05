"use client";

import { useState } from "react";
import { Copy, FilePen, Handshake, Megaphone, Rocket } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { DexScreener } from "@/features/signal/components/DexScreener";
import { BrandOrLink } from "@/features/signal/components/brands";
import type { DexEventType } from "@/features/signal";

export interface AlertItem {
  id: string;
  type: DexEventType;
  chainId: string;
  tokenAddress: string;
  payload: Record<string, unknown>;
  seenAt: string;
  market?: TokenMarket;
}

interface TokenMarket {
  symbol?: string;
  name?: string;
  priceUsd?: number;
  volume24h?: number;
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
}

interface EventPayload {
  icon?: string;
  url?: string;
  description?: string;
  amount?: number;
  totalAmount?: number;
  claimDate?: string;
  impressions?: number;
  links?: { type?: string | null; label?: string | null; url: string }[];
}

const TYPE_ICONS: Record<DexEventType, React.ReactNode> = {
  "token-profile": <FilePen className="size-4" />,
  "community-takeover": <Handshake className="size-4" />,
  boost: <Rocket className="size-4" />,
  ad: <Megaphone className="size-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  "token-profile": "Profile",
  "community-takeover": "Takeover",
  boost: "Boost",
  ad: "Ad",
};

function toIconUrl(icon: string) {
  if (!icon) return "";
  if (icon.startsWith("http")) return icon;
  return `https://cdn.dexscreener.com/cms/images/${icon}?width=64&height=64&fit=crop&quality=95&format=auto`;
}

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function formatPrice(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1) return `$${value.toFixed(value >= 100 ? 0 : 4)}`;
  if (value > 0) return `$${value.toPrecision(4)}`;
  return "—";
}

function formatCompact(value?: number) {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(0)}`;
}

function formatAge(createdAt?: number) {
  if (!createdAt) return "—";
  const ms = Date.now() - createdAt;
  if (ms < 0) return "now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function AlertRow({ item }: { item: AlertItem }) {
  const [copied, setCopied] = useState(false);
  const payload = (item.payload ?? {}) as EventPayload;
  const iconUrl = toIconUrl(String(payload.icon ?? ""));
  const eventUrl = String(payload.url ?? "");
  const dex = payload.links?.find((l) =>
    l.type?.toLowerCase().includes("dexscreener"),
  )?.url;
  const amount =
    typeof payload.amount === "number"
      ? payload.amount
      : typeof payload.totalAmount === "number"
        ? payload.totalAmount
        : null;

  function handleCopy() {
    navigator.clipboard.writeText(item.tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <TableRow>
      <TableCell>
        <span
          className="inline-flex items-center rounded bg-muted px-1.5 py-1 text-muted-foreground"
          title={TYPE_LABELS[item.type] ?? item.type}
        >
          {TYPE_ICONS[item.type]}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs">{item.chainId}</span>
      </TableCell>
      <TableCell className="max-w-[280px]">
        <div className="flex items-center gap-2">
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="size-6 shrink-0 rounded-full bg-muted object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="truncate font-mono text-xs">
            {item.tokenAddress}
          </span>
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
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {(eventUrl || dex) && <DexScreener href={dex ?? eventUrl} />}
          {payload.links &&
            payload.links.length > 0 &&
            payload.links.map((l, i) => (
              <BrandOrLink
                key={`${l.url}-${i}`}
                type={l.type ?? null}
                url={l.url}
              />
            ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          {item.type === "boost" && amount != null && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
              {amount} SOL
            </span>
          )}
          {item.type === "community-takeover" && payload.claimDate && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Claim {formatDate(payload.claimDate)}
            </span>
          )}
          {item.type === "ad" && typeof payload.impressions === "number" && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {payload.impressions.toLocaleString()} imp
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {item.market?.priceUsd != null
            ? formatPrice(item.market.priceUsd)
            : "—"}
        </span>
      </TableCell>
      <TableCell>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {item.market?.volume24h != null
            ? formatCompact(item.market.volume24h)
            : "—"}
        </span>
      </TableCell>
      <TableCell>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {item.market?.marketCap != null
            ? formatCompact(item.market.marketCap)
            : "—"}
        </span>
      </TableCell>
      <TableCell>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {item.market?.pairCreatedAt
            ? formatAge(item.market.pairCreatedAt)
            : "—"}
        </span>
      </TableCell>
      <TableCell>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {new Date(item.seenAt).toLocaleString()}
        </span>
      </TableCell>
    </TableRow>
  );
}