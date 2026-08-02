import "server-only";

import { connectToDatabase } from "@/lib/mongodb";
import { ExchangeRate } from "@/features/rates/models/ExchangeRate";

const EXCHANGE_RATE_API_URL = "https://v6.exchangerate-api.com/v6";
const TTL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_IDR_PER_USD = 16000;

export type ExchangeRates = {
  idrPerUsd: number;
  updatedAt: Date;
  fetchedAt: Date;
};

async function fetchFromApi(): Promise<ExchangeRates | null> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${EXCHANGE_RATE_API_URL}/${apiKey}/latest/USD`);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      result?: string;
      time_last_update_utc?: string;
      conversion_rates?: Record<string, number>;
    };

    if (data.result !== "success" || !data.conversion_rates?.IDR) return null;

    return {
      idrPerUsd: data.conversion_rates.IDR,
      updatedAt: new Date(data.time_last_update_utc ?? Date.now()),
      fetchedAt: new Date(),
    };
  } catch {
    return null;
  }
}

export async function refreshUsdIdrRate(): Promise<ExchangeRates | null> {
  const fresh = await fetchFromApi();
  if (!fresh) return null;

  await connectToDatabase();

  await ExchangeRate.findOneAndUpdate(
    { code: "IDR" },
    {
      $set: {
        idrPerUsd: fresh.idrPerUsd,
        base: "USD",
        updatedAt: fresh.updatedAt,
        fetchedAt: fresh.fetchedAt,
      },
    },
    { upsert: true },
  ).exec();

  return fresh;
}

export async function getUsdIdrRate(): Promise<ExchangeRates> {
  await connectToDatabase();

  const stored = await ExchangeRate.findOne({ code: "IDR" }).lean().exec();
  const isFresh =
    stored &&
    Date.now() - new Date(stored.fetchedAt).getTime() < TTL_MS;

  if (stored && isFresh) {
    return {
      idrPerUsd: stored.idrPerUsd,
      updatedAt: stored.updatedAt,
      fetchedAt: stored.fetchedAt,
    };
  }

  const refreshed = await refreshUsdIdrRate();
  if (refreshed) return refreshed;

  if (stored) {
    return {
      idrPerUsd: stored.idrPerUsd,
      updatedAt: stored.updatedAt,
      fetchedAt: stored.fetchedAt,
    };
  }

  const fallback = new Date();
  return { idrPerUsd: FALLBACK_IDR_PER_USD, updatedAt: fallback, fetchedAt: fallback };
}
