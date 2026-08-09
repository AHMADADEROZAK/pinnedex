import { NextRequest, NextResponse } from "next/server";

import {
  findChallengeByUuid,
  linkChallenge,
  setChallengeOtp,
  setChallengeUsername,
  verifyChallenge,
} from "@/features/chat/server/db";
import {
  answerPartyCallbackQuery,
  sendPartyMessage,
  sendPartyOtpButton,
  sendPartyOtpPhoto,
} from "@/features/chat/server/telegram";
import { generateOtp, getOtpExpiry, hashOtp } from "@/features/chat/lib/otp";

export const dynamic = "force-dynamic";

function getDisplayName(message: {
  from?: { first_name?: string; last_name?: string; username?: string };
}): string {
  const first = message?.from?.first_name ?? "";
  const last = message?.from?.last_name ?? "";
  const username = message?.from?.username ?? "";
  return [first, last].filter(Boolean).join(" ") || username || "Member";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.TELEGRAM_PARTY_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await req.json();

  const cb = update?.callback_query;
  if (cb) {
    const cbChatId = cb?.message?.chat?.id;
    const cbName = getDisplayName({ from: cb?.from });
    const cbUsername = cb?.from?.username ?? "";
    const cbUuid = typeof cb?.data === "string" ? cb.data.replace(/^get_otp:/, "") : "";
    if (cb?.data?.startsWith("get_otp") && cbChatId && cbUuid) {
      const challenge = await findChallengeByUuid(cbUuid);
      if (challenge) {
        await verifyChallenge(challenge.uuid, cbName);
        if (cbUsername) {
          await setChallengeUsername(challenge.uuid, cbUsername);
        }

        const otp = generateOtp();
        await setChallengeOtp(challenge.uuid, hashOtp(otp), getOtpExpiry());

        await sendPartyOtpPhoto(cbChatId, otp);
        await answerPartyCallbackQuery(cb.id, "Your code was sent to this chat");
      } else {
        await answerPartyCallbackQuery(cb.id, "No active verification found");
      }
    }
    return NextResponse.json({ ok: true });
  }

  const message = update?.message;
  const chat = message?.chat;
  const text: string = message?.text ?? "";

  if (!message || !chat) {
    return NextResponse.json({ ok: true });
  }

  const match = text.match(/^\/start(?:\s+(\S+))?/);
  if (!match) {
    return NextResponse.json({ ok: true });
  }

  const uuid = match[1] ?? "";
  if (!uuid) {
    return NextResponse.json({ ok: true });
  }

  const chatId = chat.id;
  const challenge = await findChallengeByUuid(uuid);
  if (!challenge) {
    await sendPartyMessage(
      chatId,
      "Verification failed. Room code not found.\nPlease open the Pine Room again on the Pinnedex website.",
    );
    return NextResponse.json({ ok: true });
  }

  const name = challenge.name ?? getDisplayName(message);
  await linkChallenge(uuid, String(chatId));

  await sendPartyOtpButton(
    chatId,
    `Hi ${name}! 🤖\n\n` +
      `Tap "Get verify code" below to receive your ticket code, then enter it on the website to join the Pine Room Party.`,
    uuid,
  );

  return NextResponse.json({ ok: true });
}