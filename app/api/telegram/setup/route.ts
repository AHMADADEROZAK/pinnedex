import { NextRequest, NextResponse } from "next/server";

import { signalConfig } from "@/features/signal/config";
import { setTelegramWebhook } from "@/features/signal/server/telegram";
import { requireAdmin } from "@/lib/dal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  await requireAdmin();

  const base = req.nextUrl.origin;
  const url = `${base}/api/telegram/update`;
  const ok = await setTelegramWebhook(url);

  return NextResponse.json({ ok, url, username: signalConfig.telegramBotUsername });
}
