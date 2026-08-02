import "server-only";

import { cache } from "react";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { verifySession } from "@/lib/dal";
import { Purchase } from "@/features/presale/models/Purchase";

export const hasVerifiedPurchase = cache(async () => {
  const session = await verifySession();
  await connectToDatabase();

  const filter = {
    userId: new Types.ObjectId(session.userId),
    status: "verified",
  } as unknown as Parameters<typeof Purchase.findOne>[0];

  const purchase = await Purchase.findOne(filter).lean().exec();

  return Boolean(purchase);
});
