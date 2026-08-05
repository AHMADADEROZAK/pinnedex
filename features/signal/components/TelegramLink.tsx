"use client";

import { BrandLink, type BrandLinkProps } from "@/features/signal/components/BrandLink";

export function TelegramLink(props: Omit<BrandLinkProps, "src" | "alt">) {
  return <BrandLink src="/tg.png" alt="Telegram" title="Open on Telegram" {...props} />;
}