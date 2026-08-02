import "server-only";
import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import type { UserRole } from "@/features/auth/models/User";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  expiresAt: Date;
};

const rawSecret = process.env.SESSION_SECRET ?? "";
const secretKey = createHash("sha256").update(rawSecret).digest();

export async function encrypt(payload: SessionPayload) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(secretKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtDecrypt(session, secretKey);
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: UserRole) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, role, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
