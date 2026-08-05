"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DexScreener } from "@/features/signal/components/DexScreener";
import { BrandOrLink } from "@/features/signal/components/brands";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Link {
  type: string | null;
  label: string | null;
  url: string;
}

interface ItemCardProps {
  chainId: string;
  tokenAddress: string;
  header: string | null;
  icon: string;
  description: string;
  links: Link[];
  url: string;
  amount?: number;
  totalAmount?: number;
  claimDate?: string;
}

function toIconUrl(icon: string) {
  if (!icon) return "";
  if (icon.startsWith("http")) return icon;
  return `https://cdn.dexscreener.com/cms/images/${icon}?width=64&height=64&fit=crop&quality=95&format=auto`;
}

export function ItemCard({
  chainId,
  tokenAddress,
  header,
  icon,
  description,
  links,
  url,
  amount,
  totalAmount,
  claimDate,
}: ItemCardProps) {
  const [copied, setCopied] = useState(false);
  const iconUrl = toIconUrl(icon);

  function handleCopy() {
    navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <Card size="sm" className="w-full">
      {header && (
        <img
          src={header}
          alt=""
          className="aspect-video w-full object-cover brightness-90"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}

      <CardHeader>
        <CardAction>
          <Badge variant="outline" className="text-[10px]">
            {chainId}
          </Badge>
        </CardAction>
        <div className="flex items-center gap-2">
          {iconUrl && (
            <div className="flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/10 to-muted ring-2 ring-card">
              <img
                src={iconUrl}
                alt=""
                className="size-7 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex min-w-0 items-center gap-1">
            <CardTitle className="truncate font-mono text-xs font-normal">
              {tokenAddress.slice(0, 10)}...
            </CardTitle>
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
        </div>
        <CardDescription className="text-[10px]">
          {amount !== undefined && `${amount}/${totalAmount ?? "?"}`}
          {claimDate &&
            ` - ${new Date(claimDate).toLocaleDateString()}`}
        </CardDescription>
      </CardHeader>

      {description ? (
        <CardContent className="flex-1 text-xs text-muted-foreground">
          <p className="line-clamp-2 leading-snug">{description}</p>
        </CardContent>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-1.5 px-(--card-spacing)">
          <div className="h-1.5 w-full rounded-full bg-muted" />
          <div className="h-1.5 w-2/3 rounded-full bg-muted" />
        </div>
      )}

      <CardFooter className="flex-wrap gap-1">
        {Array.isArray(links) &&
          links.map((link, i) => (
            <BrandOrLink key={i} type={link.type} url={link.url} />
          ))}
        <DexScreener href={url} />
      </CardFooter>
    </Card>
  );
}