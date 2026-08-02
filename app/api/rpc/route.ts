import { ALLOWED_METHODS, resolveRpcEndpoint } from "@/features/solana/server";
import { enforceRateLimit } from "@/features/security";

export async function POST(request: Request) {
  const limit = await enforceRateLimit(rpcRateLimit());
  if (!limit.allowed) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: { method?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.method || typeof body.method !== "string") {
    return Response.json({ error: "Missing method" }, { status: 400 });
  }

  if (!ALLOWED_METHODS.has(body.method)) {
    return Response.json({ error: "Method not allowed" }, { status: 400 });
  }

  const upstream = await fetch(resolveRpcEndpoint(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return Response.json(data);
}

function rpcRateLimit() {
  const v = Number(process.env.RPC_RATE_LIMIT_PER_MINUTE);
  return Number.isFinite(v) && v > 0 ? v : 120;
}
