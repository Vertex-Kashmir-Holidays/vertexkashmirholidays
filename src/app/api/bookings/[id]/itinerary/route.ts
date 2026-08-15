import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { buildLeadItineraryData } from "@/lib/itinerary/lead-defaults";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import type { Role } from "@/lib/rbac";
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
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id: bookingId } = await params;

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, deletedAt: null, ...bookingWhereForUser(role, userId) },
    select: {
      id: true,
      guestName: true,
      travellers: true,
      travelDate: true,
      travelEndDate: true,
      amount: true,
      servicesLocked: true,
      tour: { select: { title: true } },
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
  // Seed with booking facts. Package type defaults to the tour name (website
  // bookings); total cost is seeded from the agreed booking amount.
  const baseData = buildLeadItineraryData({
    name: booking.guestName,
    category: null,
    adults: booking.travellers,
    children: null,
    startDate: booking.travelDate,
    endDate: booking.travelEndDate ?? null,
  });
  const data = {
    ...baseData,
    packageType: booking.tour?.title?.toUpperCase() ?? baseData.packageType,
    totalCost: `Rs ${booking.amount.toLocaleString("en-IN")}/-`,
  } as unknown as Prisma.InputJsonValue;

  const created = await prisma.itinerary.create({
    data: {
      title,
      // Direct (website) bookings are already paid/confirmed by the time staff
      // generate the itinerary — unlike a lead's proposal-stage itinerary,
      // there's no pending approval step, so it should be visible in the
      // customer's account immediately (DRAFT is hidden there — see
      // itineraryVisible in account/bookings/[id]/page.tsx).
      status: "CONFIRMED",
      data,
      ownerId: guard.user.id,
      bookingId: booking.id,
      history: { create: { title, data, editedById: guard.user.id, editedByName } },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
