import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { retryRow } from "@/lib/offlineConversion/service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Retries a single offline-conversion queue row. Admin Offline Conversions module only. */
export async function POST(_req: Request, { params }: Params) {
  const guard = await requirePermission("offlineConversions", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const outcome = await retryRow(id);

  if (outcome === "not_found") {
    return NextResponse.json({ error: "Offline conversion not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, outcome });
}
