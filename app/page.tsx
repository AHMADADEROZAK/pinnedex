import Link from "next/link";
import {
  Gift,
  LayoutDashboard,
  Rocket,
  ShieldCheck,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Header } from "@/features/app-shell";
import { Button } from "@/components/ui/button";
import {
  TrustSection,
  getPresaleUsdPrices,
  presaleConfig,
} from "@/features/presale";
import { Purchase } from "@/features/presale/models/Purchase";
import { getTreasuryBalance } from "@/features/presale/server/treasury";
import { connectToDatabase } from "@/lib/mongodb";
import { formatUsd } from "@/lib/format";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Rocket,
    title: "Presale access",
    description:
      "Buy $PINE early at the presale price, with per-purchase limits.",
  },
  {
    icon: LayoutDashboard,
    title: "DexScreener dashboard",
    description:
      "Unlock a live, DexScreener-powered dashboard after a verified purchase.",
  },
  {
    icon: Wallet,
    title: "Solana wallet",
    description:
      "Connect and link your Solana wallet to buy tokens and track your allocation.",
  },
  {
    icon: ShieldCheck,
    title: "On-chain transparency",
    description:
      "Every purchase is verified on-chain and the treasury balance is live.",
  },
  {
    icon: Trophy,
    title: "Live leaderboard",
    description:
      "Top buyers ranked by tokens allocated and SOL volume.",
  },
  {
    icon: Gift,
    title: "Airdrop-ready",
    description:
      "Token allocations are recorded per wallet for post-presale distribution.",
  },
];

const steps = [
  { title: "Register", description: "Create an account in seconds." },
  {
    title: "Link your wallet",
    description: "Connect a Solana wallet to your profile.",
  },
  {
    title: "Buy tokens",
    description: "Send SOL to the collection wallet and verify on-chain.",
  },
  {
    title: "Unlock the app",
    description: "Verified purchases grant access to the dashboard.",
  },
];

const roadmap = [
  {
    phase: "Phase 1",
    title: "Presale",
    items: [
      "Presale dapp live",
      "Verified on-chain purchases",
      "Live treasury & transparency",
    ],
  },
  {
    phase: "Phase 2",
    title: "Airdrop",
    items: ["Allocate $PINE per wallet", "Distribute tokens after the presale"],
  },
  {
    phase: "Phase 3",
    title: "App launch",
    items: ["DexScreener-powered dashboard", "Trading tools for holders"],
  },
  {
    phase: "Phase 4",
    title: "Listing & LP",
    items: [
      "DEX listing",
      "Liquidity pool from the treasury",
      "LP burn as anti-rug proof",
    ],
  },
];

export default async function Page() {
  await connectToDatabase();
  const [treasury, verifiedAgg, { tokenPriceUsd }] = await Promise.all([
    getTreasuryBalance(),
    Purchase.aggregate<{ _id: null; total: number; count: number }>([
      { $match: { status: "verified" } },
      { $group: { _id: null, total: { $sum: "$solLamports" }, count: { $sum: 1 } } },
    ]).exec(),
    getPresaleUsdPrices(),
  ]);

  const totalSolCollected = (verifiedAgg[0]?.total ?? 0) / 1e9;
  const verifiedCount = verifiedAgg[0]?.count ?? 0;
  const endsAt = presaleConfig.end;

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 p-6">
        <section className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="flex flex-col gap-3">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Presale live on Solana
            </span>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
              Pinnedex
            </h1>
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
                Buy $PINE at presale prices and unlock a DexScreener-powered
                dashboard. Powered by pinesuru — token presale gated app on
                Solana.
              </p>
          </div>
          <div className="flex items-center gap-2">
            <Button nativeButton={false} render={<Link href="/presale" />}>
              Join Presale
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href="/leaderboard" />}
            >
              Leaderboard
            </Button>
          </div>

          <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat
              label="Treasury balance"
              value={
                treasury ? `${treasury.sol.toFixed(2)} SOL` : "—"
              }
            />
            <HeroStat
              label="Total collected"
              value={`${totalSolCollected.toFixed(2)} SOL`}
            />
            <HeroStat label="Verified buys" value={verifiedCount.toLocaleString()} />
            <HeroStat label="Token price" value={formatUsd(tokenPriceUsd)} />
          </div>
        </section>

        {presaleConfig.collectionWallet ? (
          <section className="flex flex-col gap-3">
            <SectionHeading
              eyebrow="Trust"
              title="Trust & transparency"
              description="See exactly where your SOL goes. The treasury is public and committed to creating liquidity after listing."
            />
            <TrustSection
              treasuryAddress={presaleConfig.collectionWallet}
              treasurySol={treasury?.sol ?? null}
              totalSolCollected={totalSolCollected}
            />
          </section>
        ) : null}

        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need for the presale"
            description="A gated app for verified buyers, built on transparent on-chain purchases."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
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

        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="How it works"
            title="Unlock the app in four steps"
            description="From registration to dashboard access."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col gap-2 rounded-md border bg-card p-4"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Roadmap"
            title="What's next"
            description="From presale to liquidity — and beyond."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((item) => (
              <div
                key={item.phase}
                className="flex flex-col gap-2 rounded-md border bg-card p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {item.phase}
                </p>
                <p className="font-heading text-lg font-semibold tracking-tight">
                  {item.title}
                </p>
                <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {item.items.map((line) => (
                    <li key={line} className="flex items-start gap-1.5">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            description="Everything you need to know before joining the presale."
          />
          <div className="flex flex-col gap-2">
            {[
              {
                q: "What is pinnedex?",
                a: "pinnedex is a presale-gated app: buy $PINE tokens early at the presale price and unlock a DexScreener-powered dashboard.",
              },
              {
                q: "How do I buy $PINE tokens?",
                a: "Register, link a Solana wallet, then send SOL to the collection wallet. Your purchase is verified on-chain before it counts.",
              },
              {
                q: "When does the presale end?",
                a: endsAt
                  ? `The presale runs until ${endsAt.toLocaleString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}.`
                  : "The presale end date has not been announced yet.",
              },
              {
                q: "How do I unlock the app?",
                a: "Verified purchases grant access to the app dashboard. You will be redirected there after a successful purchase.",
              },
              {
                q: "Where do my SOL funds go?",
                a: "Funds go to the public treasury wallet and are only used to create the liquidity pool after listing. The balance is visible on-chain.",
              },
              {
                q: "Is $PINE an SPL token?",
                a: "$PINE is currently tracked off-chain per wallet. Token distribution (airdrop) is planned after the presale.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-md border bg-card p-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="text-xs text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
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
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground"
            >
              Profile
            </Link>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            pinnedex is a token presale gated app on Solana. Cryptocurrency is
            high risk and the value of tokens can go to zero. Always do your own
            research. Nothing here is financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-card p-4 text-left">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-lg font-semibold tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </p>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
