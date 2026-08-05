import { connectToDatabase } from "@/lib/mongodb";
import { dexBudget } from "@/features/signal/ratelimit";
import { dexIngestorStatus } from "@/features/signal/ingest";
import { DexEvent } from "@/features/signal";
import { TestTelegramAlert } from "@/features/signal/components/TestTelegramAlert";

export default async function DexUsagePage() {
  const usage = dexBudget.usage();
  const status = dexIngestorStatus();

  let recentEventCount = 0;
  try {
    await connectToDatabase();
    recentEventCount = await DexEvent.countDocuments().exec();
  } catch {
    recentEventCount = -1;
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        DexScreener Usage
      </h2>

      <section>
        <h3 className="mb-2 font-heading text-base font-semibold">
          Rate Budget
        </h3>
        <div className="text-sm text-muted-foreground">
          <span>
            Per endpoint: {usage.capacityPerEndpoint}/min &middot; Global cap:{" "}
            {usage.globalCap}/min &middot; Reservation: {usage.reservation}/min
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 font-medium">Endpoint</th>
                <th className="px-2 py-1 font-medium">Total</th>
                <th className="px-2 py-1 font-medium">Bg</th>
                <th className="px-2 py-1 font-medium">User</th>
                <th className="px-2 py-1 font-medium">Bg Rem</th>
                <th className="px-2 py-1 font-medium">User Rem</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(usage.endpoints).map(([ep, u]) => (
                <tr key={ep} className="border-b">
                  <td className="px-2 py-1 font-mono">{ep}</td>
                  <td className="px-2 py-1">{u.total}</td>
                  <td className="px-2 py-1">{u.background}</td>
                  <td className="px-2 py-1">{u.user}</td>
                  <td className="px-2 py-1">{u.remainingBg}</td>
                  <td className="px-2 py-1">{u.remainingUser}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          Global: total {usage.global.total} &middot; bg {usage.global.background}{" "}
          &middot; user {usage.global.user} &middot; remaining {usage.global.remaining}
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-heading text-base font-semibold">
          WebSocket Ingestor
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1 font-medium">Stream</th>
                <th className="px-2 py-1 font-medium">Connected</th>
                <th className="px-2 py-1 font-medium">Events</th>
                <th className="px-2 py-1 font-medium">Last Event</th>
                <th className="px-2 py-1 font-medium">Reconnects</th>
                <th className="px-2 py-1 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(status).map(([key, s]) => (
                <tr key={key} className="border-b">
                  <td className="px-2 py-1">{key}</td>
                  <td className="px-2 py-1">
                    <span
                      className={s.connected ? "text-green-500" : "text-red-500"}
                    >
                      {s.connected ? "yes" : "no"}
                    </span>
                  </td>
                  <td className="px-2 py-1">{s.eventsIngested}</td>
                  <td className="px-2 py-1">
                    {s.lastEventAt ? new Date(s.lastEventAt).toLocaleTimeString() : "—"}
                  </td>
                  <td className="px-2 py-1">{s.reconnectAttempts}</td>
                  <td className="px-2 py-1 text-muted-foreground">
                    {s.lastError ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 font-heading text-base font-semibold">
          Events Persisted (TTL 24h)
        </h3>
        <p className="text-sm text-muted-foreground">
          {recentEventCount === -1
            ? "DB not reachable"
            : `${recentEventCount} events`}
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-heading text-base font-semibold">
          Telegram Delivery
        </h3>
        <TestTelegramAlert />
      </section>
    </div>
  );
}