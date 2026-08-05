import { connectToDatabase } from "@/lib/mongodb";
import { hasActiveMembership, DexEvent } from "@/features/signal";
import { DataTable } from "@/features/signal/components/DataTable";
import { ErrorState } from "@/features/signal/components/ErrorState";
import type { DexEventDocument } from "@/features/signal";

export default async function AlertsPage() {
  const active = await hasActiveMembership();
  const limit = active ? 200 : 50;
  let events: DexEventDocument[] = []; let error: string | null = null;
  try {
    await connectToDatabase();
    events = await DexEvent.find().sort({ seenAt: -1 }).limit(limit).lean().exec() as unknown as DexEventDocument[];
  } catch (err) { error = err instanceof Error ? err.message : "Failed to load alerts"; }

  return (
    <div className="flex flex-col gap-6 text-sm leading-loose">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Alerts</h1>
        {!active && <span className="text-xs text-muted-foreground">Free tier: last 50 events. Subscribe for full access.</span>}
      </div>
      {error ? <ErrorState message={error} /> : (
        <DataTable<DexEventDocument>
          columns={[
            { key: "type", header: "Type", cell: (item) => <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{item.type}</span> },
            { key: "chainId", header: "Chain", cell: (item) => item.chainId },
            { key: "tokenAddress", header: "Token", cell: (item) => <span className="font-mono text-xs">{item.tokenAddress.slice(0, 8)}...</span> },
            { key: "seenAt", header: "Time", cell: (item) => <span className="whitespace-nowrap text-xs text-muted-foreground">{new Date(item.seenAt).toLocaleString()}</span> },
          ]}
          data={events} isLoading={false} keyExtractor={(item) => String(item._id)}
        />
      )}
    </div>
  );
}