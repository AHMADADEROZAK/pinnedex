import "server-only";

import { cache } from "react";
import { clerkClient } from "@clerk/nextjs/server";

import { connectToDatabase } from "@/lib/mongodb";
import {
  User,
  type UserDocument,
  type UserRole,
} from "@/features/auth/models/User";

function roleForEmail(email: string): UserRole {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase()) ? "admin" : "user";
}

async function syncClerkRole(clerkId: string, role: UserRole) {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const current = clerkUser.publicMetadata?.role;
    if (current !== role) {
      await client.users.updateUser(clerkId, {
        publicMetadata: { ...clerkUser.publicMetadata, role },
      });
    }
  } catch {
    return;
  }
}

export const ensureUser = cache(
  async (clerkUserId: string): Promise<UserDocument | null> => {
    await connectToDatabase();

    const existing = await User.findOne({ clerkId: clerkUserId }).exec();
    if (existing) {
      if (roleForEmail(existing.email) === "admin" && existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        await syncClerkRole(clerkUserId, "admin");
      }
      return existing as UserDocument;
    }

    let email = "";
    let name = "";
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);
      email = clerkUser.primaryEmailAddress?.emailAddress ?? "";
      name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        clerkUser.username ||
        email.split("@")[0];
    } catch {
      return null;
    }

    if (!email) return null;

    const role = roleForEmail(email);

    const byEmail = await User.findOne({ email }).exec();
    if (byEmail) {
      byEmail.clerkId = clerkUserId;
      byEmail.role = role;
      await byEmail.save();
      await syncClerkRole(clerkUserId, role);
      return byEmail as UserDocument;
    }

    const user = new User({ clerkId: clerkUserId, email, name, role });
    await user.save();
    await syncClerkRole(clerkUserId, role);
    return user as UserDocument;
  },
);
