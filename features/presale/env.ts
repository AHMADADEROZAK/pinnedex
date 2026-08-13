import { z } from "zod";

const posNum = z.coerce.number().finite().positive();
const nonNegNum = z.coerce.number().finite().nonnegative();

/** Base58 string of a 32-byte Solana pubkey (1-9, no 0/O/I/l). */
const pubkey = z
  .string()
  .min(1)
  .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Solana public key");

/**
 * Schema for the presale configuration. Values are prefixed NEXT_PUBLIC_ because
 * they are needed inside client components (BuyForm, ClaimButton, etc.) and are
 * public by nature (Solana addresses, fees shown in the UI).
 *
 * Parsing happens at module load on both server and client, so a missing or
 * invalid value fails fast with a clear error instead of silently falling back
 * to a hardcoded default.
 */
export const presaleEnvSchema = z.object({
  NEXT_PUBLIC_PRESALE_PROGRAM_ID: pubkey,
  NEXT_PUBLIC_PRESALE_COLLECTION_WALLET: pubkey,
  NEXT_PUBLIC_PRESALE_TOKEN_MINT: pubkey,
  NEXT_PUBLIC_PRESALE_ADMIN_WALLET: pubkey,
  NEXT_PUBLIC_PRESALE_RPC_ENDPOINT: z.string().min(1),
  NEXT_PUBLIC_PRESALE_PRICE_PER_TOKEN: posNum,
  NEXT_PUBLIC_TOKEN_PRICE_IDR: posNum,
  NEXT_PUBLIC_IDR_PER_SOL: posNum,
  NEXT_PUBLIC_PRESALE_MIN_TOKENS: z.coerce.number().finite().int().positive(),
  NEXT_PUBLIC_PRESALE_MAX_TOKENS: z.coerce.number().finite().int().positive(),
  NEXT_PUBLIC_REGISTRATION_FEE_SOL: nonNegNum,
  NEXT_PUBLIC_LOGIN_FEE_SOL: nonNegNum,
  NEXT_PUBLIC_PRESALE_START: z.string().min(1),
  NEXT_PUBLIC_PRESALE_END: z.string().min(1),
  NEXT_PUBLIC_PRESALE_VESTING_CLIFF_DAYS: z.coerce.number().finite().int().nonnegative(),
  NEXT_PUBLIC_PRESALE_VESTING_DURATION_DAYS: z.coerce.number().finite().int().positive(),
  NEXT_PUBLIC_PRESALE_TGE_PCT: z.coerce.number().finite().min(0).max(100),
});

export type PresaleEnv = z.infer<typeof presaleEnvSchema>;

/**
 * Read the presale env vars using direct `process.env.NEXT_PUBLIC_*` accesses.
 * Bundlers (Turbopack/webpack) only statically inline NEXT_PUBLIC vars when the
 * literal member access appears in source, so passing the whole `process.env`
 * object around would silently strip these values.
 */
export function readPresaleEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_PRESALE_PROGRAM_ID: process.env.NEXT_PUBLIC_PRESALE_PROGRAM_ID,
    NEXT_PUBLIC_PRESALE_COLLECTION_WALLET: process.env.NEXT_PUBLIC_PRESALE_COLLECTION_WALLET,
    NEXT_PUBLIC_PRESALE_TOKEN_MINT: process.env.NEXT_PUBLIC_PRESALE_TOKEN_MINT,
    NEXT_PUBLIC_PRESALE_ADMIN_WALLET: process.env.NEXT_PUBLIC_PRESALE_ADMIN_WALLET,
    NEXT_PUBLIC_PRESALE_RPC_ENDPOINT: process.env.NEXT_PUBLIC_PRESALE_RPC_ENDPOINT,
    NEXT_PUBLIC_PRESALE_PRICE_PER_TOKEN: process.env.NEXT_PUBLIC_PRESALE_PRICE_PER_TOKEN,
    NEXT_PUBLIC_TOKEN_PRICE_IDR: process.env.NEXT_PUBLIC_TOKEN_PRICE_IDR,
    NEXT_PUBLIC_IDR_PER_SOL: process.env.NEXT_PUBLIC_IDR_PER_SOL,
    NEXT_PUBLIC_PRESALE_MIN_TOKENS: process.env.NEXT_PUBLIC_PRESALE_MIN_TOKENS,
    NEXT_PUBLIC_PRESALE_MAX_TOKENS: process.env.NEXT_PUBLIC_PRESALE_MAX_TOKENS,
    NEXT_PUBLIC_REGISTRATION_FEE_SOL: process.env.NEXT_PUBLIC_REGISTRATION_FEE_SOL,
    NEXT_PUBLIC_LOGIN_FEE_SOL: process.env.NEXT_PUBLIC_LOGIN_FEE_SOL,
    NEXT_PUBLIC_PRESALE_START: process.env.NEXT_PUBLIC_PRESALE_START,
    NEXT_PUBLIC_PRESALE_END: process.env.NEXT_PUBLIC_PRESALE_END,
    NEXT_PUBLIC_PRESALE_VESTING_CLIFF_DAYS: process.env.NEXT_PUBLIC_PRESALE_VESTING_CLIFF_DAYS,
    NEXT_PUBLIC_PRESALE_VESTING_DURATION_DAYS: process.env.NEXT_PUBLIC_PRESALE_VESTING_DURATION_DAYS,
    NEXT_PUBLIC_PRESALE_TGE_PCT: process.env.NEXT_PUBLIC_PRESALE_TGE_PCT,
  };
}

/** Parse and validate the presale env vars, throwing on missing/invalid input. */
export function parsePresaleEnv(source: Record<string, string | undefined>): PresaleEnv {
  return presaleEnvSchema.parse(source);
}
