import { NextRequest, NextResponse } from "next/server";
import { processPending } from "@/lib/offlineConversion/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processPending();
  return NextResponse.json({ ok: true, ...result });
}
