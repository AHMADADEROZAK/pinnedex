"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import * as z from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { verifySession } from "@/lib/dal";
import { enforceRateLimit } from "@/features/security";
import { User } from "@/features/auth/models/User";
import { signalConfig, memberFeeLamports } from "@/features/signal/config";
import { Subscription } from "@/features/signal/models/Subscription";
import { verifyMemberPayment } from "@/features/signal/server/verify";
import { type FormState } from "@/lib/definitions";

const SubscribeSchema = z.object({
  plan: z.enum(["weekly", "monthly"]),
  walletAddress: z
    .string()
    .regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, {
      error: "Invalid wallet address.",
    })
    .trim(),
  signature: z
    .string()
    .min(1, { error: "Transaction signature is required." })
    .trim(),
});

export async function subscribeMember(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) {
    return { message: "Too many requests. Please wait a minute." };
  }

  const session = await verifySession();

  const validated = SubscribeSchema.safeParse({
    plan: formData.get("plan"),
    walletAddress: formData.get("walletAddress"),
    signature: formData.get("signature"),
  });
  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >,
    };
  }

  const { plan, walletAddress, signature } = validated.data;

  await connectToDatabase();

  const user = await User.findById(session.userId).exec();
  if (!user) {
    return { message: "User not found." };
  }

  const ownsWallet = user.wallets.some((w) => w.address === walletAddress);
  if (!ownsWallet) {
    return {
      errors: { walletAddress: ["Link this wallet to your account first."] },
    };
  }

  const existing = await Subscription.findOne({ txSignature: signature }).exec();
  if (existing) {
    return {
      errors: { signature: ["This transaction signature has already been used."] },
    };
  }

  const feeLamports = memberFeeLamports(plan);
  const verified = await verifyMemberPayment(signature, feeLamports);
  if (!verified.ok) {
    return { errors: { signature: [verified.error] } };
  }

  const days = plan === "weekly" ? 7 : 30;
  const now = new Date();
  const sub = new Subscription({
    userId: session.userId,
    walletAddress,
    plan,
    amountLamports: verified.lamports,
    txSignature: signature,
    status: "active",
    startedAt: now,
    expiresAt: new Date(now.getTime() + days * 24 * 60 * 60 * 1000),
  });
  await sub.save();

  revalidatePath("/member", "layout");
  revalidatePath("/presale");

  return undefined;
}

export async function cancelMembership(): Promise<void> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) return;

  const session = await verifySession();

  await connectToDatabase();

  await Subscription.updateMany(
    { userId: session.userId, status: "active" },
    { $set: { status: "expired" } },
  ).exec();

  revalidatePath("/member", "layout");
  revalidatePath("/presale");
}

const PhoneSchema = z
  .string()
  .trim()
  .regex(/^\+?\d{8,15}$/, {
    error: "Enter a valid phone number with country code.",
  });

export type ConnectTelegramState = FormState & { link?: string };

export async function connectTelegram(
  _state: ConnectTelegramState,
  formData: FormData,
): Promise<ConnectTelegramState> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) {
    return { message: "Too many requests. Please wait a minute." };
  }

  const session = await verifySession();

  const phone = PhoneSchema.safeParse(formData.get("phone"));
  if (!phone.success) {
    return {
      errors: {
        phone: phone.error.flatten().formErrors.length
          ? phone.error.flatten().formErrors
          : ["Enter a valid phone number with country code."],
      },
    };
  }

  const signature = String(formData.get("signature") ?? "").trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(signature)) {
    return { errors: { signature: ["Transaction signature is required."] } };
  }

  await connectToDatabase();

  const sub = await Subscription.findOne({
    userId: session.userId,
    status: "active",
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .exec();
  if (!sub) {
    return { message: "Active membership required to connect Telegram." };
  }

  if (sub.telegramChatId) {
    return { message: "Telegram is already connected." };
  }

  const existing = await Subscription.findOne({ txSignature: signature }).exec();
  if (existing) {
    return {
      errors: { signature: ["This transaction signature has already been used."] },
    };
  }

  const feeLamports = Math.round(signalConfig.telegramConnectFeeSol * 1e9);
  const verified = await verifyMemberPayment(signature, feeLamports);
  if (!verified.ok) {
    return { errors: { signature: [verified.error] } };
  }

  const linkCode = `CONNECT_${randomBytes(12).toString("hex")}`;
  const now = new Date();
  sub.telegramPhone = phone.data;
  sub.telegramLinkCode = linkCode;
  sub.telegramLinkExpiresAt = new Date(now.getTime() + 15 * 60 * 1000);
  sub.telegramStatus = "pending";
  sub.amountLamports = verified.lamports;
  sub.txSignature = signature;
  await sub.save();

  const username = signalConfig.telegramBotUsername.replace(/^@/, "");
  const link = username
    ? `https://t.me/${username}?start=${linkCode}`
    : "";

  revalidatePath("/member", "layout");

  return { link };
}

export async function disconnectTelegram(): Promise<void> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) return;

  const session = await verifySession();

  await connectToDatabase();

  await Subscription.updateMany(
    { userId: session.userId, status: "active" },
    {
      $set: { telegramStatus: "pending" },
      $unset: {
        telegramChatId: "",
        telegramPhone: "",
        telegramLinkCode: "",
        telegramLinkExpiresAt: "",
      },
    },
  ).exec();

  revalidatePath("/member", "layout");
}

export interface TelegramBroadcastResult {
  ok: boolean;
  sent: number;
  targeted: number;
  message?: string;
}

export async function sendTestTelegramAlert(): Promise<TelegramBroadcastResult> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) {
    return { ok: false, sent: 0, targeted: 0, message: "Too many requests." };
  }

  const session = await verifySession();
  if (session.role !== "admin") {
    return { ok: false, sent: 0, targeted: 0, message: "Admin only." };
  }

  await connectToDatabase();

  const subs = await Subscription.find({
    status: "active",
    expiresAt: { $gt: new Date() },
    telegramChatId: { $exists: true, $ne: "" },
    telegramStatus: "connected",
  })
    .select("telegramChatId")
    .lean()
    .exec();

  const chatIds = [...new Set(subs.map((s) => String(s.telegramChatId)))];

  let sent = 0;
  for (const chatId of chatIds) {
    const { sendTelegramToChat } = await import(
      "@/features/signal/server/telegram"
    );
    if (await sendTelegramToChat(chatId, "Test alert from PINDEX Signal. Connection is working.")) {
      sent += 1;
    }
  }

  return { ok: true, sent, targeted: chatIds.length };
}