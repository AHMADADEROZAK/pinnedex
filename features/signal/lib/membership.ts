import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/dal";
import { Subscription } from "@/features/signal/models/Subscription";

export const hasActiveMembership = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  await connectToDatabase();

  const sub = await Subscription.findOne({
    userId: user._id,
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