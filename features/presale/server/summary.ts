import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";
import { presaleConfig, presaleRpcEndpoint } from "../config";

export type PresaleSummary = {
  solCollected: number;
  tokensSold: number;
  hardCapTokens: number;
  progressPct: number;
  vaultRemaining: number;
  pricePerTokenLamports: number;
  isFinalized: boolean;
};

export async function getPresaleSummary(): Promise<PresaleSummary | null> {
  try {
    const connection = new Connection(presaleRpcEndpoint, "confirmed");

    const programId = new PublicKey(presaleConfig.programId);
    const admin = new PublicKey(presaleConfig.adminWallet);
    const mint = new PublicKey(presaleConfig.tokenMint);

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("presale"), admin.toBuffer(), mint.toBuffer()],
      programId,
    );
    const [solVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("sol_vault"), configPda.toBuffer()],
      programId,
    );
    const [tokenVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), configPda.toBuffer()],
      programId,
    );

    const [configAcc, solLamports, tokenVaultAcc] = await Promise.all([
      connection.getAccountInfo(configPda),
      connection.getBalance(solVaultPda),
      connection.getParsedAccountInfo(tokenVaultPda),
    ]);

    if (!configAcc || configAcc.data.length < 130) return null;

    // PresaleConfig layout (8-byte discriminator dulu):
    // 8 authority(32) | 40 token_mint(32) | 72 price_per_token(8) | 80 sale_start(8)
    // 88 sale_end(8) | 96 cliff_duration(8) | 104 vesting_duration(8)
    // 112 hard_cap_tokens(8) | 120 tokens_sold(8) | 128 is_finalized(1) | 129 bump(1)
    const d = configAcc.data;
    const pricePerTokenLamports = Number(d.readBigUInt64LE(72));
    const hardCapTokens = Number(d.readBigUInt64LE(112));
    const tokensSold = Number(d.readBigUInt64LE(120));
    const isFinalized = d[128] === 1;

    let vaultRemaining = 0;
    if (tokenVaultAcc.value && typeof tokenVaultAcc.value.data === "object" && "parsed" in tokenVaultAcc.value.data) {
      const parsed = tokenVaultAcc.value.data.parsed as { info?: { tokenAmount?: { uiAmount?: number } } };
      vaultRemaining = parsed.info?.tokenAmount?.uiAmount ?? 0;
    }

    return {
      solCollected: solLamports / 1e9,
      tokensSold,
      hardCapTokens,
      progressPct: hardCapTokens > 0 ? (tokensSold / hardCapTokens) * 100 : 0,
      vaultRemaining,
      pricePerTokenLamports,
      isFinalized,
    };
  } catch {
    return null;
  }
}
