"use server";

import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser, verifySession } from "@/lib/dal";
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
  await verifySession();

  const limit = await enforceRateLimit();
  if (!limit.allowed) return { error: "Too many requests. Please wait a minute." };

  if (!isPresaleActive()) {
    return { error: "Presale is not open right now." };
  }

  const user = await getSessionUser();
  if (!user) {
    return { error: "User not found." };
  }

  if (user.wallets.length === 0) {
    return { error: "Link a wallet first to buy tokens." };
  }

  const signature = String(formData.get("signature") ?? "").trim();
  if (!signature) {
    return { error: "Transaction signature is required." };
  }

  await connectToDatabase();

  const existing = await Purchase.findOne({ txSignature: signature }).exec();
  if (existing) {
    return { error: "This transaction has already been recorded." };
  }

  const buyerWallet = user.wallets[0].address;
  const result = await verifyPresaleTransaction(signature, buyerWallet);

  if (!result.ok) {
    return { error: result.error };
  }

  const purchase = new Purchase({
    userId: user._id,
    walletAddress: buyerWallet,
    txSignature: signature,
    solLamports: result.lamports,
    tokenAllocation: result.tokens,
    status: "verified",
  });
  await purchase.save();

  redirect("/profile");
}
