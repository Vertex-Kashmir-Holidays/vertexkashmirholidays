import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { resolveItineraryAccess } from "@/lib/itinerary/access";
import { publishItinerary } from "@/lib/itinerary/publish";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Make the itinerary's last SAVED version visible to the customer (see
 * src/lib/itinerary/publish.ts). Same access rule as saving; a locked
 * itinerary can still be published, since its content can no longer change.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.itinerary.findUnique({
    where: { id },
    select: {
      ownerId: true,
      leadId: true,
      bookingId: true,
      locked: true,
      lead: { select: { assignedToId: true, locked: true, status: true, b2bAgentId: true } },
      booking: { select: { servicesLocked: true } },
    },
  });
  // B2B itineraries publish via /api/admin/b2b-itineraries/[id]/publish.
  if (!existing || existing.lead?.b2bAgentId != null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = resolveItineraryAccess(existing, { id: guard.user.id, role: guard.user.role });
  if (!access.canView || (!access.canEdit && !access.locked)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(await publishItinerary(id));
}
