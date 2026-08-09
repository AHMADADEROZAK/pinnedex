import { NextResponse } from "next/server";

import { findPartyMember } from "@/features/chat/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const memberId = new URL(request.url).searchParams.get("memberId") ?? "";
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const member = await findPartyMember(memberId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json({ memberId: member.memberId, name: member.name });
}