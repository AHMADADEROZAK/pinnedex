import "server-only";

import { getUsdIdrRate } from "@/features/rates/exchangeRate";
import { presaleConfig } from "../config";
import { getPresaleSummary } from "./summary";

const FALLBACK_SOL_USD = 150;
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
const LAMPORTS_PER_SOL = 1e9;

async function fetchSolPriceUsd(): Promise<number | null> {
  try {
    const res = await fetch(COINGECKO_URL, {
      next: { revalidate: 300 }, // cache 5 menit
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { solana?: { usd?: number } };
    return data.solana?.usd ?? null;
  } catch {
    return null;
  }
}

export async function getPresaleUsdPrices() {
  const { idrPerUsd } = await getUsdIdrRate();

  const liveSolUsd = await fetchSolPriceUsd();
  const solPriceUsd =
    liveSolUsd && liveSolUsd > 0
      ? liveSolUsd
      : presaleConfig.idrPerSol > 10000
        ? presaleConfig.idrPerSol / idrPerUsd
        : FALLBACK_SOL_USD;

  // Harga token derive dari on-chain price_per_token biar sinkron dengan kontrak:
  // tokenPriceUsd = pricePerTokenLamports * solPriceUsd / 1e9
  // Fallback ke env IDR jika config PDA belum ada.
  const summary = await getPresaleSummary();
  const tokenPriceUsd = summary
    ? (summary.pricePerTokenLamports * solPriceUsd) / LAMPORTS_PER_SOL
    : presaleConfig.tokenPriceIdr / idrPerUsd;

  return {
    tokenPriceUsd,
    solPriceUsd,
    idrPerUsd,
  };
}
