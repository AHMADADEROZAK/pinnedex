import { NextResponse } from "next/server";

import { setPartyWebhook } from "@/features/chat/server/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicUrl = process.env.TELEGRAM_PUBLIC_URL?.trim();
  if (!publicUrl) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_PUBLIC_URL is not set." },
      { status: 400 },
    );
  }

  const ok = await setPartyWebhook(`${publicUrl.replace(/\/$/, "")}/api/telegram/party/update`);
  return NextResponse.json({ ok });
}