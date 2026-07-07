import { NextRequest, NextResponse } from "next/server";
import { processPending } from "@/lib/offlineConversion/service";

export const dynamic = "force-dynamic";

// Not currently scheduled — Vercel Hobby doesn't support the frequency this
// sweep needs, so its entry is removed from vercel.json for now (see that
// file). enqueueForLead/enqueueForBooking (src/lib/offlineConversion/service.ts)
// attempt each conversion immediately at enqueue time instead, so this route
// is a manual/backup sweep rather than the primary trigger. Re-add the
// vercel.json cron entry when on Pro — no code change needed here.

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processPending();
  return NextResponse.json({ ok: true, ...result });
}
