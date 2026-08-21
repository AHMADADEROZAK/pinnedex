import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";

import { enforceRateLimit } from "@/features/security";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/features/auth/models/User";

export const dynamic = "force-dynamic";

function roleForEmail(email: string): "user" | "admin" {
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase()) ? "admin" : "user";
}

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
      const { id, email_addresses, first_name, last_name, username } =
        event.data;
      const email = email_addresses.find((e) => e.id === event.data.primary_email_address_id)?.email_address ?? email_addresses[0]?.email_address;
      if (!email) break;

      const name =
        [first_name, last_name].filter(Boolean).join(" ") ||
        username ||
        email.split("@")[0];
      const role = roleForEmail(email);

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          $set: { clerkId: id, email: email.toLowerCase(), name, role },
          $setOnInsert: { wallets: [] },
        },
        { upsert: true },
      ).exec();
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
