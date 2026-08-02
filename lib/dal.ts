import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { connectToDatabase } from "@/lib/mongodb";
import { User, type UserDocument } from "@/features/auth/models/User";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/login");
  }

  return {
    isAuth: true,
    userId: String(session.userId),
    role: session.role ?? "user",
  };
});

export const requireAdmin = cache(async () => {
  const session = await verifySession();
  if (session.role !== "admin") {
    notFound();
  }
  return session;
});

export const getSessionUser = cache(
  async (): Promise<UserDocument | null> => {
    const cookie = (await cookies()).get("session")?.value;
    const session = await decrypt(cookie);

    if (!session?.userId) return null;

    await connectToDatabase();
    const user = await User.findById(session.userId).lean().exec();

    return user ? (user as UserDocument) : null;
  },
);
