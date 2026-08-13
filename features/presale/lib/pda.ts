import { PublicKey } from "@solana/web3.js";
import { presaleConfig } from "@/features/presale/config";

export function getProgramId(): PublicKey {
  return new PublicKey(presaleConfig.programId);
}

export const CONFIG_SEED = "presale";
export const TOKEN_VAULT_SEED = "token_vault";
export const VAULT_AUTHORITY_SEED = "vault_authority";
export const SOL_VAULT_SEED = "sol_vault";
export const VESTING_SEED = "vesting";

export function getSpineMint(): PublicKey {
  return new PublicKey(presaleConfig.tokenMint);
}
export const SPINE_MINT = new PublicKey(presaleConfig.tokenMint);
export const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ASSOCIATED_TOKEN_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export function findConfigPda(authority: PublicKey, programId = getProgramId()): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), authority.toBuffer(), SPINE_MINT.toBuffer()],
    programId,
  );
}

export function findTokenVaultPda(configPda: PublicKey, programId = getProgramId()): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(TOKEN_VAULT_SEED), configPda.toBuffer()],
    programId,
  );
}

export function findVaultAuthorityPda(configPda: PublicKey, programId = getProgramId()): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_AUTHORITY_SEED), configPda.toBuffer()],
    programId,
  );
}

export function findSolVaultPda(configPda: PublicKey, programId = getProgramId()): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SOL_VAULT_SEED), configPda.toBuffer()],
    programId,
  );
}

export function findVestingPda(
  configPda: PublicKey,
  beneficiary: PublicKey,
  programId = getProgramId(),
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VESTING_SEED), configPda.toBuffer(), beneficiary.toBuffer()],
    programId,
  );
}
