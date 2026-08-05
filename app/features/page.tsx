import Link from "next/link";
import {
  BarChart3,
  Bell,
  Crown,
  FilePen,
  FilePenIcon,
  Gift,
  Handshake,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Radar,
  Rocket,
  Search,
  ShieldCheck,
  Tag,
  Trophy,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Header } from "@/features/app-shell";
import { Button } from "@/components/ui/button";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureGroup {
  title: string;
  description: string;
  features: Feature[];
}

const groups: FeatureGroup[] = [
  {
    title: "Signal & DexScreener",
    description: "Live data pipeline over DexScreener with typed, budgeted access.",
    features: [
      {
        icon: Rocket,
        title: "Token Boosts",
        description:
          "Latest and top boosts streamed live, with token icons, amounts and social links.",
      },
      {
        icon: Handshake,
        title: "Community Takeovers",
        description:
          "Track CTO events with claim dates, descriptions and token profile data.",
      },
      {
        icon: FilePenIcon,
        title: "Token Profiles",
        description:
          "Browse newly-created profile signals with rich metadata and external links.",
      },
      {
        icon: BarChart3,
        title: "Metas",
        description:
          "Trending metadata across chains with Solana-focused filtering and drill-downs.",
      },
      {
        icon: Search,
        title: "Search",
        description:
          "Find pairs and tokens by symbol, name or contract address instantly.",
      },
      {
        icon: Bell,
        title: "Alerts",
        description:
          "A live feed of every ingest event, filterable by type and chain.",
      },
      {
        icon: LayoutDashboard,
        title: "Dashboard",
        description:
          "A summary view of the key metrics and data across the platform.",
      },
      {
        icon: FilePen,
        title: "Detail Pages",
        description:
          "Per-token and per-pair views with full DexScreener reference data.",
      },
    ],
  },
  {
    title: "Signals & Radar",
    description: "Smart analysis for paid subscribers.",
    features: [
      {
        icon: Radar,
        title: "Robinhood Radar",
        description:
          "Detection of tokens with a Robinhood-style pump pattern for early entries.",
      },
      {
        icon: ShieldCheck,
        title: "Whale Detector",
        description:
          "Heuristic screening of pair data to surface whale movement and momentum.",
      },
      {
        icon: Crown,
        title: "Membership Signals",
        description:
          "Active subscribers get full access to whale and radar signals.",
      },
    ],
  },
  {
    title: "Telegram Alerts",
    description: "Push notifications, straight from the ingestor to your chat.",
    features: [
      {
        icon: MessageCircle,
        title: "Bot Integration",
        description:
          "Connect your Telegram via a private bot link after a one-time fee.",
      },
      {
        icon: Bell,
        title: "Takeover Alerts",
        description:
          "Receive real-time CTO takeover push notifications as events arrive.",
      },
      {
        icon: Megaphone,
        title: "Test Broadcasts",
        description:
          "Admins can send test alerts to verify end-to-end delivery.",
      },
    ],
  },
  {
    title: "Community & Commerce",
    description: "Social features and transparent on-chain commerce.",
    features: [
      {
        icon: MessageCircle,
        title: "Community Feed",
        description:
          "Post pins, comments, emoji reactions and uploads with paid premium pins.",
      },
      {
        icon: Gift,
        title: "Presale",
        description:
          "Buy $PINE early at presale price with per-purchase limits and on-chain verification.",
      },
      {
        icon: Trophy,
        title: "Leaderboard",
        description:
          "Top buyers ranked by tokens allocated and SOL volume.",
      },
      {
        icon: ShieldCheck,
        title: "On-chain Transparency",
        description:
          "Every purchase is verified on-chain with a live public treasury balance.",
      },
      {
        icon: Wallet,
        title: "Solana Wallet",
        description:
          "Connect and link a Solana wallet to sign transactions and track allocation.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 p-6">
        <section className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="flex flex-col gap-3">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" />
              Pinnedex features
            </span>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Features
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
              Everything Pinnedex ships today — live DexScreener data, smart
              radar signals, Telegram alerts and a transparent community
              marketplace on Solana.
            </p>
          </div>
        </section>

        {groups.map((group) => (
          <section key={group.title} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                {group.title}
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                {group.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-2 rounded-md border bg-card p-4"
                >
                  <feature.icon className="size-5 text-primary" />
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="flex flex-col items-center gap-4 rounded-md border bg-card p-6 text-center">
          <p className="max-w-md text-sm text-muted-foreground">
            Want the full DexScreener dashboard, radar signals and Telegram
            alerts? Connect a wallet and activate a membership.
          </p>
          <div className="flex items-center gap-2">
            <Button nativeButton={false} render={<Link href="/presale" />}>
              Join Presale
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/login" />}
            >
              Sign in
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link
              href="/presale"
              className="text-muted-foreground hover:text-foreground"
            >
              Presale
            </Link>
            <Link
              href="/leaderboard"
              className="text-muted-foreground hover:text-foreground"
            >
              Leaderboard
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            pinnedex is a token presale gated app on Solana. Cryptocurrency is
            high risk and the value of tokens can go to zero. Nothing here is
            financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}