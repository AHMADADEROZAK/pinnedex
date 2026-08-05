"use client";

import { BrandLink, type BrandLinkProps } from "@/features/signal/components/BrandLink";

export function XLink(props: Omit<BrandLinkProps, "src" | "alt">) {
  return <BrandLink src="/x.png" alt="X (Twitter)" title="Open on X" {...props} />;
}