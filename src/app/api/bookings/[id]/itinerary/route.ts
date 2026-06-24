import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { buildLeadItineraryData } from "@/lib/itinerary/lead-defaults";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Create the single current itinerary for a DIRECT (website) booking and seed its
 * history. Lead-converted bookings are rejected — they use the lead's locked
 * itinerary. Returns the existing one if already created (single-itinerary rule).
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "create");
  if (guard instanceof NextResponse) return guard;
  const { id: bookingId } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null },
    select: {
      id: true,
      guestName: true,
      travellers: true,
      travelDate: true,
      servicesLocked: true,
      itinerary: { select: { id: true } },
      leads: { take: 1, select: { id: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Lead-converted bookings reuse the lead's (locked) itinerary — read-only here.
  if (booking.leads.length > 0) {
    return NextResponse.json(
      {
        error: "This booking was converted from a lead; its itinerary is managed from the lead.",
        code: "LEAD_ITINERARY",
      },
      { status: 422 },
    );
  }

  // Single-itinerary rule: never create a second one.
  if (booking.itinerary) {
    return NextResponse.json({ id: booking.itinerary.id, existing: true });
  }

  // Editing (and creation) is only allowed while services are unlocked.
  if (booking.servicesLocked) {
    return NextResponse.json(
      { error: "Services are locked for this booking — the itinerary can no longer be created." },
      { status: 422 },
    );
  }

  const editedByName = (guard.user.name ?? guard.user.email) as string;
  const title = `${booking.guestName} — Kashmir Itinerary`;
  // Reuse the lead seed builder with booking-derived facts (price starts at 0).
  const data = buildLeadItineraryData({
    name: booking.guestName,
    category: null,
    adults: booking.travellers,
    children: null,
    startDate: booking.travelDate,
    endDate: null,
  }) as unknown as Prisma.InputJsonValue;

  const created = await prisma.itinerary.create({
    data: {
      title,
      status: "DRAFT",
      data,
      ownerId: guard.user.id,
      bookingId: booking.id,
      history: { create: { title, data, editedById: guard.user.id, editedByName } },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
