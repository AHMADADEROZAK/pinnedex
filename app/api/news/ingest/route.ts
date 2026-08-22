import { NextResponse } from "next/server";

import { syncNews } from "@/features/news/server/fetch";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const summary = await syncNews();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "sync failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}