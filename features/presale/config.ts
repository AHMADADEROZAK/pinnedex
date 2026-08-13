const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const presaleConfig = {
  get programId() {
    return process.env.PRESALE_PROGRAM_ID ?? "6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3";
  },
  get collectionWallet() {
    return process.env.PRESALE_COLLECTION_WALLET ?? "";
  },
  get tokenMint() {
    return process.env.PRESALE_TOKEN_MINT ?? "8PydPRxUmKE88V2kurQyMCA33V1Ny4QBgSPrxNQsdQip";
  },
  get pricePerTokenLamports() {
    return num(process.env.PRESALE_PRICE_PER_TOKEN, 1000);
  },
  get adminWallet() {
    return process.env.PRESALE_ADMIN_WALLET ?? "2hsTq8QVdkuNhEcjgZbbDz2LXRudMfofixZV5hiQi417";
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
  get registrationFeeSol() {
    return num(process.env.REGISTRATION_FEE_SOL, 0.025);
  },
  get registrationFeeLamports() {
    return Math.round(this.registrationFeeSol * 1e9);
  },
  get loginFeeSol() {
    return num(process.env.LOGIN_FEE_SOL, 0.002);
  },
  get loginFeeLamports() {
    return Math.round(this.loginFeeSol * 1e9);
  },
  get start() {
    const v = process.env.PRESALE_START;
    return v ? new Date(v) : null;
  },
  get end() {
    const v = process.env.PRESALE_END;
    return v ? new Date(v) : null;
  },
  get vestingCliffDays() {
    return num(process.env.PRESALE_VESTING_CLIFF_DAYS, 7);
  },
  get vestingDurationDays() {
    return num(process.env.PRESALE_VESTING_DURATION_DAYS, 30);
  },
  get tgePct() {
    return num(process.env.PRESALE_TGE_PCT, 20);
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
