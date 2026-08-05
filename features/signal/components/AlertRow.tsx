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
          {new Date(item.seenAt).toLocaleString()}
        </span>
      </TableCell>
    </TableRow>
  );
}