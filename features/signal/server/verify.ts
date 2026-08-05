import "server-only";

import { Connection, PublicKey } from "@solana/web3.js";

import { resolveRpcEndpoint } from "@/features/solana/server";
import { signalConfig } from "@/features/signal/config";

export type VerifyResult =
  | { ok: true; lamports: number }
  | { ok: false; error: string };

function toPublicKey(address: string): PublicKey | null {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

export async function verifyMemberPayment(
  txSignature: string,
  requiredLamports: number,
): Promise<VerifyResult> {
  const signature = txSignature.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)) {
    return { ok: false, error: "Invalid transaction signature." };
  }

  const collectionPk = toPublicKey(signalConfig.collectionWallet);
  if (!collectionPk) {
    return { ok: false, error: "Collection wallet is not configured." };
  }

  const connection = new Connection(resolveRpcEndpoint(), "confirmed");

  let tx: Awaited<ReturnType<typeof connection.getParsedTransaction>> = null;
  for (let i = 0; i < 8; i++) {
    tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
    if (tx) break;
    await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
  }

  if (!tx) {
    return {
      ok: false,
      error: "Transaction not found. Check the signature or wait a moment.",
    };
  }

  if (tx.meta?.err !== null) {
    return { ok: false, error: "Transaction failed on-chain." };
  }

  let lamports = 0;

  for (const ix of tx.transaction.message.instructions) {
    if ("parsed" in ix && ix.program === "system") {
      const parsed = ix.parsed as {
        type?: string;
        info?: { destination?: string; lamports?: number };
      };
      if (
        parsed.type === "transfer" &&
        parsed.info?.destination === collectionPk.toString()
      ) {
        lamports += parsed.info.lamports ?? 0;
      }
    }
  }

  if (lamports < requiredLamports) {
    return {
      ok: false,
      error: `Payment not met. Send at least ${(requiredLamports / 1e9).toFixed(4)} SOL to the collection wallet.`,
    };
  }

  return { ok: true, lamports };
}