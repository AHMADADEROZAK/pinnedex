"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Boost } from "@/features/signal/client";

function toIconUrl(icon: string) {
  if (!icon) return "";
  if (icon.startsWith("http")) return icon;
  return `https://cdn.dexscreener.com/cms/images/${icon}?width=64&height=64&fit=crop&quality=95&format=auto`;
}

export function BoostRow({ boost }: { boost: Boost }) {
  const iconUrl = toIconUrl(boost.icon);

  return (
    <TableRow>
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
          <Badge variant="outline" className="text-[10px]">
            {boost.chainId}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-mono text-xs">
          {boost.tokenAddress.slice(0, 12)}...
        </span>
      </TableCell>
      <TableCell className="text-xs">
        {boost.amount != null ? boost.amount : "-"}/
        {boost.totalAmount != null ? boost.totalAmount : "-"}
      </TableCell>
      <TableCell className="max-w-48">
        <p className="truncate text-xs text-muted-foreground">
          {boost.description ?? "-"}
        </p>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {boost.links?.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline"
            >
              {link.type ?? "link"}
            </a>
          ))}
          <a
            href={boost.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline"
          >
            ds
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      </TableCell>
    </TableRow>
  );
}