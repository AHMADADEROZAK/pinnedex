import { Coins, DollarSign, Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPresaleSummary } from "@/features/presale/server/summary";

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toLocaleString();
}

function StatCard({
  title,
  icon: Icon,
  value,
  caption,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  caption: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-end">
        <div className="text-2xl font-bold tabular-nums leading-none">
          {value}
        </div>
        <div className="mt-2 flex h-5 items-center text-xs text-muted-foreground">
          {caption}
        </div>
      </CardContent>
    </Card>
  );
}

export async function PresaleSummaryCards() {
  const summary = await getPresaleSummary();

  if (!summary) {
    return (
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        Presale data unavailable.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        title="SOL Collected"
        icon={DollarSign}
        value={summary.solCollected.toFixed(3)}
        caption="SOL"
      />
      <StatCard
        title="Tokens Sold"
        icon={Coins}
        value={formatCompact(summary.tokensSold)}
        caption={`of ${formatCompact(summary.hardCapTokens)} SPINE`}
      />
      <StatCard
        title="Progress"
        icon={TrendingUp}
        value={`${summary.progressPct.toFixed(2)}%`}
        caption={
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, summary.progressPct)}%` }}
            />
          </div>
        }
      />
      <StatCard
        title="Vault Remaining"
        icon={Wallet}
        value={formatCompact(summary.vaultRemaining)}
        caption="SPINE left"
      />
    </div>
  );
}
