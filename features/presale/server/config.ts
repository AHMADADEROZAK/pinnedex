import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";
import { presaleConfig, presaleRpcEndpoint } from "../config";

export interface OnChainPresaleConfig {
  admin: string;
  vault: string;
  pricePerToken: number;
  maxTokenPerAddress: number;
  totalDeposited: number;
  totalSold: number;
  startTime: number;
  endTime: number;
  isPaused: boolean;
}

export async function fetchOnChainConfig(): Promise<OnChainPresaleConfig | null> {
  try {
    const conn = new Connection(presaleRpcEndpoint, "confirmed");
    const programId = new PublicKey(presaleConfig.programId);
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("presale_config")],
      programId,
    );

    const acc = await conn.getAccountInfo(configPda);
    if (!acc) return null;

    // Anchor account discriminator (8 bytes) + Pubkey(32) + Pubkey(32) + Pubkey(32) + u64(8) + u64(8)
    // + u64(8) + u64(8) + i64(8) + i64(8) + bool(1) + u8(1) = 170 bytes
    const d = acc.data;
    const offset = 8; // skip discriminator
    const admin = new PublicKey(d.subarray(offset, offset + 32)).toString();
    const vault = new PublicKey(d.subarray(offset + 32, offset + 64)).toString();
    // token_mint is at offset + 64 (32 bytes) - skip
    const pricePerToken = Number(d.readBigUInt64LE(offset + 96));
    const maxTokenPerAddress = Number(d.readBigUInt64LE(offset + 104));
    const totalDeposited = Number(d.readBigUInt64LE(offset + 112));
    const totalSold = Number(d.readBigUInt64LE(offset + 120));
    const startTime = Number(d.readBigInt64LE(offset + 128));
    const endTime = Number(d.readBigInt64LE(offset + 136));
    const isPaused = d[offset + 144] === 1;

    return { admin, vault, pricePerToken, maxTokenPerAddress, totalDeposited, totalSold, startTime, endTime, isPaused };
  } catch {
    return null;
  }
}
