import { searchPairs, getLatestTokenProfiles } from "@/features/signal/client";
import { SearchForm } from "@/features/signal/components/SearchForm";
import { SearchResults } from "@/features/signal/components/SearchResults";
import { SearchSkeleton } from "@/features/signal/components/SearchSkeleton";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { Pair, TokenProfile } from "@/features/signal/client";

function profileIndex(profiles: TokenProfile[]): Record<string, TokenProfile> {
  const index: Record<string, TokenProfile> = {};
  for (const p of profiles) {
    if (!p.tokenAddress) continue;
    const key = p.tokenAddress.toLowerCase();
    if (!index[key]) index[key] = p;
  }
  return index;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; w?: string }> }) {
  const { q, w } = await searchParams;
  const wallet = w ?? "";

  let results: Pair[] | undefined; let error: string | null = null;
  let profiles: TokenProfile[] = [];
  if (q) {
    try { results = await searchPairs(q); } catch (err) { error = err instanceof Error ? err.message : "Search failed"; }
  }
  if (q && results && results.length > 0) {
    try { profiles = await getLatestTokenProfiles(); } catch { profiles = []; }
  }
  const profileIdx = profileIndex(profiles);

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Search Pairs</h1>
      <SearchForm wallet={wallet} />
      {!q ? <SearchSkeleton /> : error ? <ErrorState message={error} /> : results !== undefined && results.length === 0 ? <p className="text-muted-foreground">No results for &quot;{q}&quot;.</p> : results && results.length > 0 ? (
        <SearchResults results={results} profiles={profileIdx} wallet={wallet} />
      ) : null}
    </div>
  );
}