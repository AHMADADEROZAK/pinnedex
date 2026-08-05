"use client";

import { useState } from "react";
import {
  Copy,
  FilePen,
  Handshake,
  Megaphone,
  Rocket,
} from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { DexScreener } from "@/features/signal/components/DexScreener";
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

export function AlertRow({ item }: { item: AlertItem }) {
  const [copied, setCopied] = useState(false);
  const payload = (item.payload ?? {}) as EventPayload;
  const iconUrl = toIconUrl(String(payload.icon ?? ""));
  const eventUrl = String(payload.url ?? "");
  const dex = payload.links?.find((l) =>
    l.type?.toLowerCase().includes("dexscreener"),
  )?.url;

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
      <TableCell>
        <div className="flex items-center gap-2">
          {iconUrl && (
            <img
              src={iconUrl}
              alt=""
              className="size-6 rounded-full bg-muted object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <span className="font-mono text-xs">
            {item.tokenAddress.slice(0, 12)}...
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
          {(eventUrl || dex) && (
            <DexScreener href={dex ?? eventUrl} />
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