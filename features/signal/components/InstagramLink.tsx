"use client";

import { BrandLink, type BrandLinkProps } from "@/features/signal/components/BrandLink";

export function InstagramLink(props: Omit<BrandLinkProps, "src" | "alt">) {
  return <BrandLink src="/ig.png" alt="Instagram" title="Open on Instagram" {...props} />;
}