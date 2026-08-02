"use server";

import { revalidatePath } from "next/cache";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser, verifySession } from "@/lib/dal";
import { enforceRateLimit } from "@/features/security";
import { User } from "@/features/auth/models/User";

const WALLET_LINK_MESSAGE = "pinnedex wallet link";

export type LinkWalletState =
  | { success?: boolean; error?: string; linkedAddress?: string }
  | undefined;

export async function linkWallet(
  _state: LinkWalletState,
  formData: FormData,
): Promise<LinkWalletState> {
  await verifySession();

  const limit = await enforceRateLimit();
  if (!limit.allowed) return { error: "Too many requests. Please wait a minute." };

  const user = await getSessionUser();
  if (!user) return { error: "User not found." };

  const address = String(formData.get("address") ?? "").trim();
  const signature = String(formData.get("signature") ?? "").trim();

  if (!address || !signature) {
    return { error: "Address and signature are required." };
  }

  let publicKey: PublicKey;
  try {
    publicKey = new PublicKey(address);
  } catch {
    return { error: "Invalid wallet address." };
  }

  let signatureBytes: Uint8Array;
  try {
    signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
  } catch {
    return { error: "Invalid signature data." };
  }

  const message = new TextEncoder().encode(WALLET_LINK_MESSAGE);

  const valid = nacl.sign.detached.verify(
    message,
    signatureBytes,
    publicKey.toBytes(),
  );

  if (!valid) {
    return { error: "Signature could not be verified for this wallet." };
  }

  await connectToDatabase();

  const existing = await User.findOne({
    _id: user._id,
    "wallets.address": address,
  }).exec();

  if (!existing) {
    await User.updateOne(
      { _id: user._id },
      { $push: { wallets: { address, linkedAt: new Date() } } },
    ).exec();
  }

  revalidatePath("/presale");
  revalidatePath("/profile");

  return { success: true, linkedAddress: address };
}
