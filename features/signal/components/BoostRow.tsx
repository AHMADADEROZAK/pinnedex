"use client";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { DexScreener } from "@/features/signal/components/DexScreener";
import { BrandOrLink } from "@/features/signal/components/brands";
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
            <BrandOrLink key={i} type={link.type} url={link.url} />
          ))}
          <DexScreener href={boost.url} />
        </div>
      </TableCell>
    </TableRow>
  );
}