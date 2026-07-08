import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { processPending } from "@/lib/offlineConversion/service";

export const dynamic = "force-dynamic";

/**
 * Backs the admin Offline Conversions module's "Retry Pending" button — the
 * same processPending() sweep the (currently unregistered on Hobby) cron
 * route calls. Manual trigger, no schedule.
 */
export async function POST() {
  const guard = await requirePermission("offlineConversions", "edit");
  if (guard instanceof NextResponse) return guard;

  const result = await processPending();
  return NextResponse.json(result);
}
