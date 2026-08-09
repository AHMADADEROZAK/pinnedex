import { NextResponse } from "next/server";

import {
  findChallengeWithOtp,
  joinPartyMember,
  verifyChallenge,
} from "@/features/chat/server/db";
import { hashOtp } from "@/features/chat/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { uuid?: string; otp?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const uuid = body.uuid?.trim() ?? "";
  const otp = (body.otp ?? "").trim().toUpperCase();

  if (!uuid || !otp) {
    return NextResponse.json(
      { error: "Missing uuid or OTP" },
      { status: 400 },
    );
  }

  const challenge = await findChallengeWithOtp(uuid);
  if (!challenge) {
    return NextResponse.json(
      { error: "No active verification found. Please press Start on Telegram again." },
      { status: 404 },
    );
  }

  if (challenge.otpExpiresAt && new Date(challenge.otpExpiresAt).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "OTP has expired. Press Start on Telegram again." },
      { status: 410 },
    );
  }

  if (challenge.otp !== hashOtp(otp)) {
    return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
  }

  const name = challenge.name ?? "Member";
  const member = await joinPartyMember(name, challenge.username);
  await verifyChallenge(uuid, name);

  return NextResponse.json({
    success: true,
    memberId: member.memberId,
    name: member.name,
  });
}