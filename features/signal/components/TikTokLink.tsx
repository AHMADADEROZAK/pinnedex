"use client";

import { BrandLink, type BrandLinkProps } from "@/features/signal/components/BrandLink";

export function TikTokLink(props: Omit<BrandLinkProps, "src" | "alt">) {
  return <BrandLink src="/tk.png" alt="TikTok" title="Open on TikTok" {...props} />;
}