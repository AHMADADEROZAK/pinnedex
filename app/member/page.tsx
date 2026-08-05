import {
  getTrendingMetas,
  getTopBoosts,
  getLatestCommunityTakeovers,
  getLatestTokenProfiles,
  getLatestBoosts,
} from "@/features/signal/client";
import type { Meta, Boost, CommunityTakeover } from "@/features/signal/client";
import { connectToDatabase } from "@/lib/mongodb";
import { DexEvent } from "@/features/signal";
import { DataCard } from "@/features/signal/components/DataCard";
import { ItemCard } from "@/features/signal/components/ItemCard";

const SOLANA = "solana";

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtPct(v: number): string {
  const sign = v >= 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

function pctColor(v: number): string {
  return v >= 0 ? "text-green-500" : "text-red-500";
}

async function fetchMetas(): Promise<Meta[]> {
  try { return await getTrendingMetas(); } catch { return []; }
}
async function fetchBoosts(): Promise<Boost[]> {
  try { return await getTopBoosts(); } catch { return []; }
}
async function fetchTakeovers(): Promise<CommunityTakeover[]> {
  try {
    const ctos = await getLatestCommunityTakeovers();
    return ctos.filter((c) => c.chainId === SOLANA);
  } catch { return []; }
}
async function fetchLatestProfiles() {
  try {
    const profiles = await getLatestTokenProfiles();
    return profiles.filter((p) => p.chainId === SOLANA);
  } catch { return []; }
}
async function fetchLatestBoosts() {
  try {
    const boosts = await getLatestBoosts();
    return boosts.filter((b) => b.chainId === SOLANA);
  } catch { return []; }
}

export default async function AppPage() {
  const [metas, boosts, takeovers, profiles, latestBoosts] =
    await Promise.all([
      fetchMetas(),
      fetchBoosts(),
      fetchTakeovers(),
      fetchLatestProfiles(),
      fetchLatestBoosts(),
    ]);

  let alert24h = 0;
  try {
    await connectToDatabase();
    alert24h = await DexEvent.countDocuments({
      seenAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).exec();
  } catch { /* ignore */ }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DataCard title="CTO Events" value={takeovers.length} description="Solana community takeovers" />
        <DataCard title="Active Boosts" value={latestBoosts.length} description="Token boosts on Solana" />
        <DataCard title="Profiles" value={profiles.length} description="Latest Solana profiles" />
        <DataCard title="Alerts (24h)" value={alert24h} description="Real-time ingest events" />
      </div>

      <section>
        <h2 className="font-heading mb-3 text-lg font-semibold tracking-tight">Trending Metas</h2>
        {metas.length === 0 ? (
          <p className="text-muted-foreground">No trending metas available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {metas.slice(0, 12).map((m) => (
              <div key={m.slug} className="rounded-lg border bg-card p-4 text-card-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-muted-foreground">({m.tokenCount} tokens)</span>
                </div>
                {m.description && <p className="mt-1 line-clamp-2 text-muted-foreground">{m.description}</p>}
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span>MCap</span><span className="text-right font-mono">{formatCompact(m.marketCap)}</span>
                  <span>Vol</span><span className="text-right font-mono">{formatCompact(m.volume)}</span>
                  <span>Liq</span><span className="text-right font-mono">{formatCompact(m.liquidity)}</span>
                  <span className="col-span-2 mt-1 text-muted-foreground">
                    24h: <span className={pctColor(m.marketCapChange.h24)}>{fmtPct(m.marketCapChange.h24)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading mb-3 text-lg font-semibold tracking-tight">Top Boosted</h2>
        {boosts.length === 0 ? (
          <p className="text-muted-foreground">No boosted tokens available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boosts.slice(0, 12).map((b) => (
              <ItemCard
                key={`${b.chainId}-${b.tokenAddress}`}
                chainId={b.chainId}
                tokenAddress={b.tokenAddress}
                header={b.header}
                icon={b.icon}
                description={b.description ?? ""}
                links={b.links ?? []}
                url={b.url}
                amount={b.amount}
                totalAmount={b.totalAmount}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading mb-3 text-lg font-semibold tracking-tight">CTO — Community Token Takeovers (Solana)</h2>
        {takeovers.length === 0 ? (
          <p className="text-muted-foreground">No CTO events on Solana.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {takeovers.slice(0, 12).map((t) => (
              <ItemCard
                key={`${t.chainId}-${t.tokenAddress}`}
                chainId={t.chainId}
                tokenAddress={t.tokenAddress}
                header={t.header}
                icon={t.icon}
                description={t.description ?? ""}
                links={t.links ?? []}
                url={t.url}
                claimDate={t.claimDate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}