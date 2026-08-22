import "server-only";

import { cache } from "react";

import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/dal";
import { Purchase } from "@/features/presale/models/Purchase";

export const hasVerifiedPurchase = cache(async () => {
  const user = await getSessionUser();
  if (!user) return false;
  await connectToDatabase();

  const purchase = await Purchase.findOne({
    userId: user._id,
    status: "verified",
  } as unknown as Parameters<typeof Purchase.findOne>[0])
    .lean()
    .exec();

  return Boolean(purchase);
});
