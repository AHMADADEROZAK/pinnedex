import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";

import { auth } from "@clerk/nextjs/server";

import { ensureUser } from "@/features/auth/server/ensure-user";
import type { UserDocument } from "@/features/auth/models/User";

export const verifySession = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const user = await ensureUser(userId);

  return {
    isAuth: true,
    userId,
    role: (user?.role ?? "user") as "user" | "admin",
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
    const { userId } = await auth();

    if (!userId) return null;

    return ensureUser(userId);
  },
);
