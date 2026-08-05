import { getLatestCommunityTakeovers } from "@/features/signal/client";
import { ItemCard } from "@/features/signal/components/ItemCard";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { CommunityTakeover } from "@/features/signal/client";

const SOLANA = "solana";

export default async function MemberTakeoversPage() {
  let data: CommunityTakeover[] = [];
  let error: string | null = null;
  try {
    const raw = await getLatestCommunityTakeovers();
    data = raw.filter((c) => c.chainId === SOLANA);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load takeovers";
  }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        CTO — Community Token Takeovers
      </h1>

      {error ? (
        <ErrorState message={error} />
      ) : data.length === 0 ? (
        <p className="text-muted-foreground">No CTO events on Solana.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((t) => (
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
    </div>
  );
}