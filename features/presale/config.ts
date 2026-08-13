import { parsePresaleEnv, readPresaleEnv } from "./env";

const env = parsePresaleEnv(readPresaleEnv());

/** Presale ALWAYS runs on devnet (SPINE mint is a devnet token). */
export const presaleRpcEndpoint = env.NEXT_PUBLIC_PRESALE_RPC_ENDPOINT;

export const presaleConfig = {
  programId: env.NEXT_PUBLIC_PRESALE_PROGRAM_ID,
  collectionWallet: env.NEXT_PUBLIC_PRESALE_COLLECTION_WALLET,
  tokenMint: env.NEXT_PUBLIC_PRESALE_TOKEN_MINT,
  pricePerTokenLamports: env.NEXT_PUBLIC_PRESALE_PRICE_PER_TOKEN,
  adminWallet: env.NEXT_PUBLIC_PRESALE_ADMIN_WALLET,
  tokenPriceIdr: env.NEXT_PUBLIC_TOKEN_PRICE_IDR,
  idrPerSol: env.NEXT_PUBLIC_IDR_PER_SOL,
  minTokens: env.NEXT_PUBLIC_PRESALE_MIN_TOKENS,
  maxTokens: env.NEXT_PUBLIC_PRESALE_MAX_TOKENS,
  registrationFeeSol: env.NEXT_PUBLIC_REGISTRATION_FEE_SOL,
  get registrationFeeLamports() {
    return Math.round(this.registrationFeeSol * 1e9);
  },
  loginFeeSol: env.NEXT_PUBLIC_LOGIN_FEE_SOL,
  get loginFeeLamports() {
    return Math.round(this.loginFeeSol * 1e9);
  },
  start: new Date(env.NEXT_PUBLIC_PRESALE_START),
  end: new Date(env.NEXT_PUBLIC_PRESALE_END),
  vestingCliffDays: env.NEXT_PUBLIC_PRESALE_VESTING_CLIFF_DAYS,
  vestingDurationDays: env.NEXT_PUBLIC_PRESALE_VESTING_DURATION_DAYS,
  tgePct: env.NEXT_PUBLIC_PRESALE_TGE_PCT,
};

export function isPresaleActive(now = new Date()) {
  if (now < presaleConfig.start) return false;
  if (now > presaleConfig.end) return false;
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
