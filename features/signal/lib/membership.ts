import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/mongodb";
import { verifySession } from "@/lib/dal";
import { Subscription } from "@/features/signal/models/Subscription";

export const hasActiveMembership = cache(async () => {
  const session = await verifySession();
  await connectToDatabase();

  const sub = await Subscription.findOne({
    userId: new Types.ObjectId(session.userId),
    status: "active",
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .lean()
    .exec();

  return Boolean(sub);
});

export async function requireActiveMembership() {
  const ok = await hasActiveMembership();
  if (!ok) redirect("/presale");
}