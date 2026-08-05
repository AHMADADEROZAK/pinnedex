import Link from "next/link";
import { getLatestTokenProfiles, getRecentTokenProfileUpdates } from "@/features/signal/client";
import { ItemCard } from "@/features/signal/components/ItemCard";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { TokenProfile } from "@/features/signal/client";

const SOLANA = "solana";

export default async function ProfilesPage({ searchParams }: { searchParams: Promise<{ tab?: string; w?: string }> }) {
  const { tab, w } = await searchParams;
  const wallet = w ?? "";
  const isUpdates = tab === "updates";
  const base = wallet ? `/${wallet}` : "";

  let data: TokenProfile[] = []; let error: string | null = null;
  try {
    const raw = isUpdates ? await getRecentTokenProfileUpdates() : await getLatestTokenProfiles();
    data = raw.filter((p) => p.chainId === SOLANA);
  } catch (err) { error = err instanceof Error ? err.message : "Failed to load profiles"; }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Token Profiles</h1>
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Link href={`${base}/profiles`} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${isUpdates ? "" : "bg-primary text-primary-foreground"}`}>Latest</Link>
          <Link href={`${base}/profiles?tab=updates`} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${isUpdates ? "bg-primary text-primary-foreground" : ""}`}>Updates</Link>
        </div>
      </div>
      {error ? <ErrorState message={error} /> : data.length === 0 ? <p className="text-muted-foreground">No profiles found on Solana.</p> : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((p) => (
            <ItemCard key={`${p.chainId}-${p.tokenAddress}`} chainId={p.chainId} tokenAddress={p.tokenAddress} header={p.header} icon={p.icon} description={p.description ?? ""} links={p.links ?? []} url={p.url} />
          ))}
        </div>
      )}
    </div>
  );
}