import { getUsdIdrRate, refreshUsdIdrRate } from "@/features/rates/exchangeRate";
import { enforceRateLimit } from "@/features/security";

export async function GET() {
  const limit = await enforceRateLimit(60);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 },
    );
  }

  const rate = await getUsdIdrRate();

  return Response.json({
    base: "USD",
    target: "IDR",
    idrPerUsd: rate.idrPerUsd,
    usdPerIdr: 1 / rate.idrPerUsd,
    updatedAt: rate.updatedAt.toISOString(),
    fetchedAt: rate.fetchedAt.toISOString(),
  });
}

export async function POST() {
  const limit = await enforceRateLimit(5);
  if (!limit.allowed) {
    return Response.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 },
    );
  }

  const refreshed = await refreshUsdIdrRate();

  if (!refreshed) {
    return Response.json({ error: "Failed to refresh exchange rate." }, { status: 502 });
  }

  return Response.json({
    base: "USD",
    target: "IDR",
    idrPerUsd: refreshed.idrPerUsd,
    usdPerIdr: 1 / refreshed.idrPerUsd,
    updatedAt: refreshed.updatedAt.toISOString(),
    fetchedAt: refreshed.fetchedAt.toISOString(),
  });
}
