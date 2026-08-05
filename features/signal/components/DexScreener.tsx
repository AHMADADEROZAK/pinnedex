"use client";

import { BrandLink, type BrandLinkProps } from "@/features/signal/components/BrandLink";

export function DexScreener(props: Omit<BrandLinkProps, "src" | "alt">) {
  return <BrandLink src="/dex.png" alt="DexScreener" title="Open on DexScreener" {...props} />;
}