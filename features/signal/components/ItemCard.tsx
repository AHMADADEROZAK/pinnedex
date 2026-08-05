"use client";

import { useState } from "react";
import { Copy, ExternalLink, Globe, MessageCircle, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

const linkIcons: Record<string, React.ReactNode> = {
  twitter: (
    <svg className="size-2.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  telegram: <MessageCircle className="size-2.5" />,
  tiktok: <Video className="size-2.5" />,
};

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
            <div className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-muted ring-2 ring-card">
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

      {description && (
        <CardContent className="text-xs text-muted-foreground">
          <p className="line-clamp-2 leading-snug">{description}</p>
        </CardContent>
      )}

      <CardFooter className="flex-wrap gap-1">
        {Array.isArray(links) &&
          links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 rounded border bg-secondary/20 px-1 py-0.5 text-[9px] text-muted-foreground hover:text-foreground"
            >
              {link.type
                ? (linkIcons[link.type] ?? <Globe className="size-2.5" />)
                : <Globe className="size-2.5" />}
              {link.label ?? link.type ?? "link"}
            </a>
          ))}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[9px] text-primary hover:underline"
        >
          ds
          <ExternalLink className="size-2" />
        </a>
      </CardFooter>
    </Card>
  );
}