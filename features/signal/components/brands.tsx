"use client";

import { XLink } from "@/features/signal/components/XLink";
import { TelegramLink } from "@/features/signal/components/TelegramLink";
import { TikTokLink } from "@/features/signal/components/TikTokLink";
import { RedditLink } from "@/features/signal/components/RedditLink";
import { InstagramLink } from "@/features/signal/components/InstagramLink";
import { LinkIcon } from "@/features/signal/components/LinkIcon";

function brandComponent(
  type: string | null | undefined,
  url: string | null | undefined,
): React.ReactNode {
  switch (type) {
    case "twitter":
    case "x":
    case "XTwitter":
      return <XLink href={url ?? ""} />;
    case "telegram":
    case "Telegram":
      return <TelegramLink href={url ?? ""} />;
    case "tiktok":
    case "TikTok":
      return <TikTokLink href={url ?? ""} />;
    case "reddit":
    case "Reddit":
      return <RedditLink href={url ?? ""} />;
    case "instagram":
    case "Instagram":
      return <InstagramLink href={url ?? ""} />;
    default:
      break;
  }

  let host = "";
  try {
    host = new URL(url ?? "").hostname.toLowerCase();
  } catch {
    host = (url ?? "").toLowerCase();
  }

  if (host.includes("x.com") || host.includes("twitter.com")) {
    return <XLink href={url ?? ""} />;
  }
  if (
    host.includes("t.me") ||
    host.includes("telegram.org") ||
    host.includes("telegram.me")
  ) {
    return <TelegramLink href={url ?? ""} />;
  }
  if (host.includes("tiktok.com")) return <TikTokLink href={url ?? ""} />;
  if (host.includes("reddit.com")) return <RedditLink href={url ?? ""} />;
  if (host.includes("instagram.com")) return <InstagramLink href={url ?? ""} />;

  return <LinkIcon href={url ?? ""} />;
}

export function BrandOrLink({
  type,
  url,
}: {
  type: string | null | undefined;
  url: string | null | undefined;
}) {
  return brandComponent(type, url);
}