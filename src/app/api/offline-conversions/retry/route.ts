import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { retryRow } from "@/lib/offlineConversion/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string()).min(1).max(200),
});

/**
 * Bulk-retries a caller-specified set of queue rows — backs both "Retry
 * Selected" and "Retry Failed" in the admin UI (the client gathers the ids;
 * this route is intentionally the same for both actions). Sequential, same
 * as processPending()'s own loop, to avoid hammering a platform API concurrently.
 */
export async function POST(req: NextRequest) {
  const guard = await requirePermission("offlineConversions", "edit");
  if (guard instanceof NextResponse) return guard;

  let ids: string[];
  try {
    ids = schema.parse(await req.json()).ids;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  let sent = 0;
  let failed = 0;
  let notFound = 0;

  for (const id of ids) {
    const outcome = await retryRow(id);
    if (outcome === "sent") sent++;
    else if (outcome === "failed") failed++;
    else notFound++;
  }

  return NextResponse.json({ processed: ids.length, sent, failed, notFound });
}
