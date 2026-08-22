import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { enforceRateLimit } from "@/features/security";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/features/auth/models/User";
import { syncClerkUser } from "@/features/auth/server/ensure-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const limit = await enforceRateLimit();
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook Clerk belum dikonfigurasi." },
      { status: 500 },
    );
  }

  const headers = req.headers;
  const wh = new Webhook(secret);
  let event: WebhookEvent;

  try {
    event = wh.verify(await req.text(), {
      "svix-id": headers.get("svix-id") ?? "",
      "svix-timestamp": headers.get("svix-timestamp") ?? "",
      "svix-signature": headers.get("svix-signature") ?? "",
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Signature tidak valid." }, { status: 400 });
  }

  await connectToDatabase();

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      await syncClerkUser(event.data.id);
      break;
    }
    case "user.deleted": {
      const { id } = event.data;
      if (id) {
        await User.updateOne({ clerkId: id }, { $unset: { clerkId: 1 } }).exec();
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
