"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LinkIconProps {
  href: string;
  className?: string;
  title?: string;
}

export function LinkIcon({ href, className, title = "Open link" }: LinkIconProps) {
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
      <ExternalLink className="size-3.5" />
    </Button>
  );
}