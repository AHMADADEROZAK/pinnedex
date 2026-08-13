import { STAGES, LAMPORTS_PER_SOL } from "./constants.js";

export type StageInfo = {
  index: number;
  priceUsd: number;
  supply: number;
};

export function getCurrentStage(soldTokens: number): {
  stage: StageInfo;
  remainingInStage: number;
  totalSoldInStage: number;
} {
  let accumulated = 0;
  for (const stage of STAGES) {
    const stageSold = Math.max(0, Math.min(stage.supply, soldTokens - accumulated));
    if (accumulated + stage.supply > soldTokens) {
      return {
        stage,
        remainingInStage: stage.supply - stageSold,
        totalSoldInStage: stageSold,
      };
    }
    accumulated += stage.supply;
  }
  const last = STAGES[STAGES.length - 1];
  return { stage: last, remainingInStage: 0, totalSoldInStage: last.supply };
}

export function getTokenAmount(solAmount: number, solPriceUsd: number, stagePriceUsd: number): number {
  const usdValue = solAmount * solPriceUsd;
  return Math.floor(usdValue / stagePriceUsd);
}

export function getSolForTokens(tokenAmount: number, solPriceUsd: number, stagePriceUsd: number): number {
  const usdNeeded = tokenAmount * stagePriceUsd;
  return usdNeeded / solPriceUsd;
}

export async function fetchSolPrice(): Promise<number> {
  const resp = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
  );
  const data = (await resp.json()) as { solana: { usd: number } };
  return data.solana.usd;
}
