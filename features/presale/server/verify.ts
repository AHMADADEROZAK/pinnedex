import { Connection, PublicKey } from "@solana/web3.js";

import { resolveRpcEndpoint } from "@/features/solana/server";
import { presaleConfig, solLamportsToTokens } from "@/features/presale/config";

export type VerifyResult =
  | { ok: true; lamports: number; tokens: number }
  | { ok: false; error: string };

export async function verifyPresaleTransaction(
  txSignature: string,
  buyerWallet: string,
): Promise<VerifyResult> {
  const signature = txSignature.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)) {
    return { ok: false, error: "Invalid transaction signature." };
  }

  const buyerPk = toPublicKey(buyerWallet);
  const collectionPk = toPublicKey(presaleConfig.collectionWallet);
  if (!buyerPk || !collectionPk) {
    return { ok: false, error: "Invalid wallet address." };
  }

  const connection = new Connection(resolveRpcEndpoint(), "confirmed");

  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    return { ok: false, error: "Transaction not found. Check the signature or wait a moment." };
  }

  if (tx.meta?.err !== null) {
    return { ok: false, error: "Transaction failed on-chain." };
  }

  const message = tx.transaction.message;
  let lamports = 0;

  for (const ix of message.instructions) {
    if ("parsed" in ix && ix.program === "system") {
      const parsed = ix.parsed as {
        type?: string;
        info?: { source?: string; destination?: string; lamports?: number };
      };
      if (
        parsed.type === "transfer" &&
        parsed.info?.source === buyerPk.toString() &&
        parsed.info.destination === collectionPk.toString()
      ) {
        lamports += parsed.info.lamports ?? 0;
      }
    }
  }

  if (lamports <= 0) {
    return { ok: false, error: "No matching SOL transfer to the collection wallet." };
  }

  const tokens = solLamportsToTokens(lamports);

  if (tokens < presaleConfig.minTokens) {
    return {
      ok: false,
      error: `Amount below minimum (${presaleConfig.minTokens} tokens).`,
    };
  }
  if (tokens > presaleConfig.maxTokens) {
    return {
      ok: false,
      error: `Amount above maximum (${presaleConfig.maxTokens} tokens).`,
    };
  }

  return { ok: true, lamports, tokens };
}

function toPublicKey(address: string): PublicKey | null {
  try {
    return new PublicKey(address);
  } catch {
    return null;
  }
}

export type RegistrationPaymentResult =
  | { ok: true; lamports: number }
  | { ok: false; error: string };

export async function verifyRegistrationPayment(
  txSignature: string,
): Promise<RegistrationPaymentResult> {
  return verifyTransferToCollection(txSignature, presaleConfig.registrationFeeLamports);
}

export async function verifyLoginPayment(
  txSignature: string,
): Promise<RegistrationPaymentResult> {
  return verifyTransferToCollection(txSignature, presaleConfig.loginFeeLamports);
}

async function verifyTransferToCollection(
  txSignature: string,
  minLamports: number,
): Promise<RegistrationPaymentResult> {
  const signature = txSignature.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)) {
    return { ok: false, error: "Invalid transaction signature." };
  }

  const collectionPk = toPublicKey(presaleConfig.collectionWallet);
  if (!collectionPk) {
    return { ok: false, error: "Collection wallet is not configured." };
  }

  const connection = new Connection(resolveRpcEndpoint(), "confirmed");

  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    return { ok: false, error: "Transaction not found. Check the signature or wait a moment." };
  }

  if (tx.meta?.err !== null) {
    return { ok: false, error: "Transaction failed on-chain." };
  }

  const message = tx.transaction.message;
  let lamports = 0;

  for (const ix of message.instructions) {
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

  const requiredSol = minLamports / 1e9;
  if (lamports < minLamports) {
    return {
      ok: false,
      error: `Payment not met. Send at least ${requiredSol} SOL to the collection wallet.`,
    };
  }

  return { ok: true, lamports };
}
