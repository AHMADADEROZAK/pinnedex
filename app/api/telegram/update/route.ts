import { NextRequest, NextResponse } from "next/server";

import { signalConfig } from "@/features/signal/config";
import {
  processBotUpdate,
  type TelegramUpdate,
} from "@/features/signal/server/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = signalConfig.telegramWebhookSecret;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update: TelegramUpdate = await req.json();
  await processBotUpdate(update);

  return NextResponse.json({ ok: true });
}
