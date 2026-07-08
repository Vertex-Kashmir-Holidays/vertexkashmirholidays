import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { extractRequestId, checkRequestStatus } from "@/lib/admin/offlineConversions";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Read-only diagnostic check — asks the platform what actually happened to a
 * previously-accepted request. Does not touch the queue row or any stored
 * data; gated at "view" (not "edit") since it can't mutate anything.
 */
export async function POST(_req: Request, { params }: Params) {
  const guard = await requirePermission("offlineConversions", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const row = await prisma.offlineConversion.findUnique({
    where: { id },
    select: { platform: true, platformResponse: true },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const requestId = extractRequestId(row.platformResponse);
  if (!requestId) {
    return NextResponse.json({ ok: false, status: "ERROR", message: "No request ID available for this row yet." });
  }

  const result = await checkRequestStatus(row.platform, requestId);
  return NextResponse.json(result);
}
