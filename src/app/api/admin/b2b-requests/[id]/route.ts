import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { b2bRequestFieldsSchema } from "@/lib/b2b/requestSchema";
import { leadFactsItineraryOps } from "@/lib/itinerary/leadFactsSync";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Edit a B2B request's guest + trip details (same fields as creation). Its
 * itinerary's cover (name, phone, dates, duration, travellers) follows the new
 * values — see src/lib/itinerary/leadFactsSync.ts. Converted/locked requests
 * are frozen: the booking is the source of truth from then on.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bRequests", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      b2bAgentId: true,
      status: true,
      locked: true,
      tour: { select: { title: true } },
      itinerary: { select: { id: true, data: true, locked: true } },
    },
  });
  if (!lead || lead.b2bAgentId === null) {
    return NextResponse.json({ error: "B2B request not found" }, { status: 404 });
  }
  if (lead.status === "CONVERTED" || lead.locked) {
    return NextResponse.json(
      { error: "This request is converted to a booking — edit the booking instead." },
      { status: 423 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = b2bRequestFieldsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;
  const startDate = d.startDate ? new Date(d.startDate) : null;
  const endDate = d.endDate ? new Date(d.endDate) : null;
  const adults = d.pax ?? 1;

  const itineraryOps = lead.itinerary
    ? await leadFactsItineraryOps(
        lead.itinerary,
        {
          name: d.guestName,
          phone: d.guestPhone,
          tourTitle: lead.tour?.title ?? null,
          adults,
          children: d.children ?? null,
          startDate,
          endDate,
        },
        { id: guard.user.id as string, name: (guard.user.name ?? guard.user.email) as string },
      )
    : [];

  const [updated] = await prisma.$transaction([
    prisma.lead.update({
      where: { id },
      data: {
        name: d.guestName,
        phone: d.guestPhone,
        adults,
        // Cleared optional inputs clear the stored value.
        children: d.children ?? null,
        days: d.days ?? null,
        rooms: d.rooms ?? null,
        budget: d.budget ?? null,
        startDate,
        endDate,
        notes: d.notes ?? null,
      },
      select: { id: true, name: true },
    }),
    ...itineraryOps,
  ]);

  return NextResponse.json({ ...updated, itinerarySynced: itineraryOps.length > 0 });
}
