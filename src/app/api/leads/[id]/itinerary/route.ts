import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Create the single current itinerary for a lead and seed its history.
 * Enforces: one itinerary per lead, assignment scoping, and the converted-lock.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "create");
  if (guard instanceof NextResponse) return guard;
  const { id: leadId } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      name: true,
      assignedToId: true,
      status: true,
      itinerary: { select: { id: true } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // SALES (non-admin) may only act on leads assigned to them.
  if (!isAdminRole(guard.user.role) && lead.assignedToId !== guard.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (lead.status === "CONVERTED") {
    return NextResponse.json(
      { error: "Lead is converted — its itinerary is locked." },
      { status: 422 },
    );
  }
  // Single-itinerary rule: never create a second one.
  if (lead.itinerary) {
    return NextResponse.json({ id: lead.itinerary.id, existing: true });
  }

  const editedByName = (guard.user.name ?? guard.user.email) as string;
  const title = `${lead.name} — Kashmir Itinerary`;
  const data = DEFAULT_ITINERARY_DATA as unknown as Prisma.InputJsonValue;

  const created = await prisma.itinerary.create({
    data: {
      title,
      status: "DRAFT",
      data,
      ownerId: guard.user.id,
      leadId: lead.id,
      history: {
        create: { title, data, editedById: guard.user.id, editedByName },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
