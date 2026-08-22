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

type ClerkWeb3Wallet = string | { web3Wallet?: string } | null | undefined;

function extractWeb3Wallets(clerkUser: {
  web3Wallets?: ClerkWeb3Wallet[];
}): string[] {
  return (clerkUser.web3Wallets ?? [])
    .map((w) => (typeof w === "string" ? w : w?.web3Wallet ?? ""))
    .filter(Boolean);
}

function fallbackIdentity(
  clerkUserId: string,
  email: string,
  wallets: string[],
): { email: string; nameHint: string } {
  if (email) return { email: email.toLowerCase(), nameHint: "" };
  const wallet = wallets[0] ?? "";
  const identifier = wallet || clerkUserId;
  return {
    email: `${identifier.toLowerCase()}@wallets.pinnedex.internal`,
    nameHint: wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "Member",
  };
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  );
}

function resolveRole(email: string, currentRole?: UserRole): UserRole {
  if (currentRole === "admin") return "admin";
  return roleForEmail(email);
}

export async function syncClerkUser(
  clerkUserId: string,
): Promise<UserDocument | null> {
  await connectToDatabase();

  let primaryEmail = "";
  let wallets: string[] = [];
  let name = "";
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    primaryEmail = clerkUser.primaryEmailAddress?.emailAddress ?? "";
    wallets = extractWeb3Wallets(clerkUser);
    name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      "";
  } catch {
    return null;
  }

  const identity = fallbackIdentity(clerkUserId, primaryEmail, wallets);
  const email = identity.email;
  name = name || identity.nameHint;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = (await User.findOne({
      clerkId: clerkUserId,
    }).exec()) as UserDocument | null;
    if (existing) {
      const role = resolveRole(existing.email, existing.role);
      if (existing.role !== role) {
        existing.role = role;
        await existing.save();
      }
      await syncClerkRole(clerkUserId, role);
      return existing;
    }

    const byEmail = (await User.findOne({
      email,
    }).exec()) as UserDocument | null;
    if (byEmail) {
      const role = resolveRole(byEmail.email, byEmail.role);
      byEmail.clerkId = clerkUserId;
      byEmail.role = role;
      try {
        await byEmail.save();
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
        continue;
      }
      await syncClerkRole(clerkUserId, role);
      return byEmail;
    }

    const role = roleForEmail(email);
    try {
      const user = await User.create({
        clerkId: clerkUserId,
        email,
        name,
        role,
      });
      await syncClerkRole(clerkUserId, role);
      return user as UserDocument;
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }
  }

  console.error(
    `Sinkronisasi user Clerk ${clerkUserId} gagal setelah beberapa percobaan.`,
  );
  return (await User.findOne({
    clerkId: clerkUserId,
  }).exec()) as UserDocument | null;
}

export const ensureUser = cache(syncClerkUser);
