"use client";

import { BrandLink, type BrandLinkProps } from "@/features/signal/components/BrandLink";

export function RedditLink(props: Omit<BrandLinkProps, "src" | "alt">) {
  return <BrandLink src="/rd.png" alt="Reddit" title="Open on Reddit" {...props} />;
}