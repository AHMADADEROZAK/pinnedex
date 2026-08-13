import { address, type Address } from "gill";
import type { PresaleConfig, VestingAccount } from "../target/types/presale.js";

export const PRESALE_PROGRAM_ID = "6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3" as Address;

// Seed constants (must match Rust constants.rs)
export const CONFIG_SEED = "presale";
export const TOKEN_VAULT_SEED = "token_vault";
export const VAULT_AUTHORITY_SEED = "vault_authority";
export const SOL_VAULT_SEED = "sol_vault";
export const VESTING_SEED = "vesting";

// SPL token
export const SPINE_MINT = "8PydPRxUmKE88V2kurQyMCA33V1Ny4QBgSPrxNQsdQip" as Address;
export const SPINE_DECIMALS = 0;

// Instruction discriminators (8-byte SHA256("global:<name>"))
export const DISCRIMINATORS = {
  initializePresale: new Uint8Array([9, 174, 12, 126, 150, 119, 68, 100]),
  depositTokens: new Uint8Array([176, 83, 229, 18, 191, 143, 176, 150]),
  buyTokens: new Uint8Array([189, 21, 230, 133, 247, 2, 110, 42]),
  claimTokens: new Uint8Array([108, 216, 210, 231, 0, 212, 42, 64]),
  withdrawSol: new Uint8Array([145, 131, 74, 136, 65, 137, 42, 38]),
  finalizePresale: new Uint8Array([100, 245, 60, 81, 177, 232, 255, 99]),
};

export const LAMPORTS_PER_SOL = 1_000_000_000n;

export type { PresaleConfig, VestingAccount };
