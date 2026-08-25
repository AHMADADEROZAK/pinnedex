"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export const PUMP_FUN_CA = "HGXokkbaqUixM8JbsBHcEjhCVyartUrrQnV4YJH7pump";
export const PUMP_FUN_URL = `https://pump.fun/coin/${PUMP_FUN_CA}`;

export function ContractAddressBanner({
  variant = "compact",
  className,
}: {
  variant?: "compact" | "hero";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PUMP_FUN_CA);
      setCopied(true);
      toast.add({
        title: "Contract address copied",
        description: "Paste it in your wallet to buy SPINE.",
        type: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.add({ title: "Failed to copy", type: "error" });
    }
  }

  const hero = variant === "hero";

  const copyButton = (
    <Button
      variant={hero ? "secondary" : "ghost"}
      size={hero ? "lg" : "icon-sm"}
      className={cn(
        "shrink-0",
        hero
          ? "gap-2 font-semibold"
          : "text-primary-foreground hover:bg-black/20 hover:text-primary-foreground"
      )}
      onClick={handleCopy}
      aria-label="Copy contract address"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {hero && (copied ? "Copied" : "Copy CA")}
    </Button>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-primary via-primary/85 to-primary text-primary-foreground",
        hero && "rounded-lg",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]"
      />

      <div
        className={cn(
          "relative mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 text-center sm:justify-between",
          hero ? "flex-col px-5 py-6 sm:py-8" : "justify-center px-4 py-2 md:px-8"
        )}
      >
        <p className="flex items-center justify-center gap-2 font-semibold">
          <Rocket className={cn("shrink-0", hero ? "size-6" : "size-4")} />
          <span className={hero ? "font-heading text-xl sm:text-2xl" : "text-xs sm:text-sm"}>
            Buy <span className="font-bold">SPINE</span> on Pump.fun
          </span>
        </p>

        {hero ? (
          <div className="flex w-full max-w-xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <code className="rounded-md bg-black/25 px-3 py-2 font-mono text-sm break-all">
              {PUMP_FUN_CA}
            </code>
            <div className="flex items-center gap-2">
              {copyButton}
              <a
                href={PUMP_FUN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-foreground px-4 font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
              >
                Buy now
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 font-mono text-[11px] sm:text-xs">
            <span className="hidden text-primary-foreground/80 sm:inline">CA:</span>
            <span className="rounded bg-black/20 px-2 py-0.5">{PUMP_FUN_CA}</span>
            {copyButton}
            <a
              href={PUMP_FUN_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-sans font-semibold hover:underline"
            >
              Buy
              <ExternalLink className="size-3.5" />
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
