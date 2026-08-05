import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { enforceRateLimit } from "@/features/security";
import { CountryCode } from "@/features/signal/models/CountryCode";

export async function GET() {
  const limit = await enforceRateLimit(60);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 },
    );
  }

  await connectToDatabase();

  const codes = await CountryCode.find().sort({ name: 1 }).lean().exec();

  return NextResponse.json(
    codes.map((c) => ({
      name: c.name,
      dialCode: c.dialCode,
      code: c.code,
    })),
  );
}
