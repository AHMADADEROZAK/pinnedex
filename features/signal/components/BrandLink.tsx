"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BrandLinkProps {
  href: string;
  className?: string;
  title?: string;
  src: string;
  alt: string;
}

export function BrandLink({ href, className, title, src, alt }: BrandLinkProps) {
  if (!href) return null;

  return (
    <Button
      render={
        <a href={href} target="_blank" rel="noopener noreferrer" title={title} />
      }
      nativeButton={false}
      variant="ghost"
      size="icon-xs"
      className={cn("border border-border bg-background hover:bg-muted", className)}
    >
      <Image
        src={src}
        alt={alt}
        width={16}
        height={16}
        className="size-4 object-contain"
      />
    </Button>
  );
}