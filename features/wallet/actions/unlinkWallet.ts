"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser, verifySession } from "@/lib/dal";
import { User } from "@/features/auth/models/User";

export async function unlinkWallet(address: string) {
  await verifySession();

  const user = await getSessionUser();
  if (!user) return { error: "User not found." };

  await connectToDatabase();

  await User.updateOne(
    { _id: user._id },
    { $pull: { wallets: { address } } },
  ).exec();

  revalidatePath("/presale");
  revalidatePath("/profile");

  return { success: true };
}
