import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Admin-only: re-lock a converted lead (and its itinerary) after an admin
 * had previously unlocked it for corrections — the inverse of /unlock. */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("leads", "edit");
  if (guard instanceof NextResponse) return guard;
  if (!isAdminRole(guard.user.role)) {
    return NextResponse.json({ error: "Only an admin can lock a lead." }, { status: 403 });
  }
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, locked: true, status: true, b2bAgentId: true },
  });
  // B2B requests are managed exclusively via /api/admin/b2b-requests.
  if (!lead || lead.b2bAgentId !== null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (lead.status !== "CONVERTED") {
    return NextResponse.json({ error: "Only a converted lead can be locked." }, { status: 422 });
  }
  if (lead.locked) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.lead.update({ where: { id }, data: { locked: true } }),
    prisma.itinerary.updateMany({ where: { leadId: id }, data: { locked: true } }),
    prisma.leadActivity.create({
      data: {
        leadId: id,
        type: "NOTE_ADDED",
        note: "Lead re-locked by admin.",
        performedById: guard.user.id as string,
        performedByName: (guard.user.name ?? guard.user.email) as string,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
