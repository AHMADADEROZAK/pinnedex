import { connectToDatabase } from "@/lib/mongodb";
import { BannedIp, IpRateLimit, banIp } from "@/features/security";

export async function GET() {
  await connectToDatabase();

  const banned = await BannedIp.find().sort({ createdAt: -1 }).lean().exec();

  return Response.json({
    banned: banned.map((b) => ({
      ip: b.ip,
      reason: b.reason,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  let body: { ip?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ip = body?.ip?.trim();
  if (!ip) {
    return Response.json({ error: "IP is required" }, { status: 400 });
  }

  await banIp(ip, body.reason ?? "Manually banned");

  return Response.json({ ok: true, ip });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip")?.trim();
  if (!ip) {
    return Response.json({ error: "IP is required" }, { status: 400 });
  }

  await connectToDatabase();

  await BannedIp.deleteOne({ ip }).exec();
  await IpRateLimit.deleteOne({ ip }).exec();

  return Response.json({ ok: true, ip });
}
