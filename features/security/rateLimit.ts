import "server-only";

import { headers } from "next/headers";

import { connectToDatabase } from "@/lib/mongodb";
import { BannedIp, IpRateLimit } from "@/features/security/models/Security";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 5);

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "rate-limited" | "banned"; retryAfterSec: number };

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function isBanned(ip: string): Promise<boolean> {
  await connectToDatabase();
  const doc = await BannedIp.findOne({ ip }).lean().exec();
  return Boolean(doc);
}

export async function banIp(ip: string, reason: string) {
  if (ip === "unknown") return;
  await connectToDatabase();
  await BannedIp.updateOne(
    { ip },
    { $setOnInsert: { ip, reason } },
    { upsert: true },
  ).exec();
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  await connectToDatabase();

  if (await isBanned(ip)) {
    return { allowed: false, reason: "banned", retryAfterSec: 0 };
  }

  if (ip === "unknown") return { allowed: true };

  const now = Date.now();
  const cutoff = new Date(now - WINDOW_MS);

  const doc = await IpRateLimit.findOneAndUpdate(
    { ip },
    { $setOnInsert: { ip, timestamps: [] } },
    { upsert: true, returnDocument: "after" },
  ).exec();

  const recent = doc.timestamps.filter((t) => t.getTime() >= cutoff.getTime());

  if (recent.length >= MAX_REQUESTS) {
    await banIp(ip, `Exceeded ${MAX_REQUESTS} requests in 60 seconds`);
    return { allowed: false, reason: "banned", retryAfterSec: 0 };
  }

  await IpRateLimit.updateOne(
    { ip },
    { $set: { timestamps: [...recent, new Date(now)] } },
  ).exec();

  return { allowed: true };
}

export async function enforceRateLimit(): Promise<RateLimitResult> {
  const ip = await getClientIp();
  return checkRateLimit(ip);
}
