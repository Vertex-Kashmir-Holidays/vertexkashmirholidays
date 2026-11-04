import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { resolveB2bItineraryAccess } from "@/lib/itinerary/access";
import { publishItinerary } from "@/lib/itinerary/publish";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Make a B2B itinerary's last SAVED version visible to the agent (see
 * src/lib/itinerary/publish.ts). Same access rule as saving it; a locked
 * itinerary can still be published, since its content can no longer change.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.itinerary.findUnique({
    where: { id },
    select: {
      locked: true,
      lead: {
        select: { b2bAgentId: true, locked: true, status: true, booking: { select: { servicesLocked: true } } },
      },
    },
  });
  if (!existing || existing.lead?.b2bAgentId == null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const access = resolveB2bItineraryAccess(
    { locked: existing.locked, lead: existing.lead },
    { role: guard.user.role, canEditItineraries: true },
  );
  if (!access.canEdit && !access.locked) {
    return NextResponse.json({ error: "Only an admin can publish a converted request's itinerary." }, { status: 403 });
  }

  return NextResponse.json(await publishItinerary(id));
}
