const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const presaleConfig = {
  get collectionWallet() {
    return process.env.PRESALE_COLLECTION_WALLET ?? "";
  },
  get tokenPriceIdr() {
    return num(process.env.TOKEN_PRICE_IDR, 5);
  },
  get idrPerSol() {
    return num(process.env.IDR_PER_SOL, 16000);
  },
  get minTokens() {
    return num(process.env.PRESALE_MIN_TOKENS, 100);
  },
  get maxTokens() {
    return num(process.env.PRESALE_MAX_TOKENS, 10000);
  },
  get start() {
    const v = process.env.PRESALE_START;
    return v ? new Date(v) : null;
  },
  get end() {
    const v = process.env.PRESALE_END;
    return v ? new Date(v) : null;
  },
};

export function isPresaleActive(now = new Date()) {
  if (presaleConfig.start && now < presaleConfig.start) return false;
  if (presaleConfig.end && now > presaleConfig.end) return false;
  return true;
}

export function tokensToSol(tokens: number) {
  return (tokens * presaleConfig.tokenPriceIdr) / presaleConfig.idrPerSol;
}

export function solLamportsToTokens(lamports: number) {
  const sol = lamports / 1e9;
  const tokens = Math.floor((sol * presaleConfig.idrPerSol) / presaleConfig.tokenPriceIdr);
  return tokens;
}

export async function getPresaleUsdPrices() {
  const { getUsdIdrRate } = await import("@/features/rates/exchangeRate");
  const { idrPerUsd } = await getUsdIdrRate();

  return {
    tokenPriceUsd: presaleConfig.tokenPriceIdr / idrPerUsd,
    solPriceUsd: presaleConfig.idrPerSol / idrPerUsd,
    idrPerUsd,
  };
}
