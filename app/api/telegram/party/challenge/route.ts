import { NextResponse } from "next/server";

import { createChallenge, findChallengeByUuid } from "@/features/chat/server/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const challenge = await createChallenge("", "party");
  const botUsername = process.env.TELEGRAM_PARTY_BOT_USERNAME ?? "pinnedex_party_bot";

  return NextResponse.json({
    uuid: challenge.uuid,
    botLink: `https://t.me/${botUsername}?start=${challenge.uuid}`,
  });
}

export async function GET(request: Request) {
  const uuid = new URL(request.url).searchParams.get("uuid") ?? "";
  if (!uuid) {
    return NextResponse.json({ error: "Missing uuid" }, { status: 400 });
  }

  const challenge = await findChallengeByUuid(uuid);
  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  return NextResponse.json({
    uuid: challenge.uuid,
    username: challenge.username,
    status: challenge.status,
    name: challenge.name ?? null,
  });
}