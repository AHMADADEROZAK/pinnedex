"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/dal";
import { enforceRateLimit } from "@/features/security";
import { Purchase } from "@/features/presale/models/Purchase";
import { verifyPresaleTransaction } from "@/features/presale/server/verify";
import { isPresaleActive } from "@/features/presale/config";

export type SubmitPurchaseState =
  | { message?: string; error?: string; tokens?: number; signature?: string }
  | undefined;

export async function submitPurchase(
  _state: SubmitPurchaseState,
  formData: FormData,
): Promise<SubmitPurchaseState> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) return { error: "Too many requests. Please wait a minute." };

  if (!isPresaleActive()) {
    return { error: "Presale is not open right now." };
  }

  const user = await getSessionUser();

  const signature = String(formData.get("signature") ?? "").trim();
  if (!signature) {
    return { error: "Transaction signature is required." };
  }

  const wallet = String(formData.get("wallet") ?? "").trim();
  const buyerWallet = wallet || user?.wallets?.[0]?.address || "";
  if (!buyerWallet) {
    return {
      error: user
        ? "Link a wallet first to buy tokens."
        : "Connect a wallet first to buy tokens.",
    };
  }

  await connectToDatabase();

  const existing = await Purchase.findOne({ txSignature: signature }).exec();
  if (existing) {
    return { error: "This transaction has already been recorded." };
  }

  const result = await verifyPresaleTransaction(signature, buyerWallet);

  if (!result.ok) {
    return { error: result.error };
  }

  const purchase = new Purchase({
    userId: user?._id ?? null,
    walletAddress: buyerWallet,
    txSignature: signature,
    solLamports: result.lamports,
    tokenAllocation: result.tokens,
    status: "verified",
  });
  await purchase.save();

  revalidatePath("/presale");

  return {
    message: "Purchase recorded! Your tokens are locked into the allocation.",
    tokens: result.tokens,
    signature,
  };
}