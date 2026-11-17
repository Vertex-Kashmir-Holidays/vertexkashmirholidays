import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { leadFactsItineraryOps } from "@/lib/itinerary/leadFactsSync";

// Trip facts kept in sync between itinerary ⇄ lead ⇄ booking: name, phone,
// travel dates and travellers. Proposals are a one-time convert and stay out.
//
//   itinerary ⇄ lead: leadFactsSync.ts (+ the lead/itinerary routes).
//   lead → booking:   tripSyncOps() — once converted, while the booking's
//                     services are unlocked.
//   booking → lead + itinerary: bookingToLeadOps() — from the booking's Edit
//                     details, which is itself only open while unlocked.
//
// Whenever the booking's start date moves, its hotel services' check-in/out
// move by the same number of days (hotelShiftOps).

export interface TripFacts {
  start?: Date;
  end?: Date | null;
  name?: string;
  phone?: string;
  adults?: number;
  children?: number | null;
}

const DAY_MS = 86_400_000;
const sameDay = (a: Date | null | undefined, b: Date | null | undefined) =>
  (a?.getTime() ?? null) === (b?.getTime() ?? null);

/** Lead `days` from a date range (inclusive), or undefined without both ends. */
const daysBetween = (start: Date | null | undefined, end: Date | null | undefined) =>
  start && end ? Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1 : undefined;

type HotelService = { id: string; checkIn: Date | null; checkOut: Date | null };

/** Move every hotel service's check-in/out by the change in trip start date. */
export function hotelShiftOps(
  services: HotelService[],
  oldStart: Date,
  newStart: Date,
): Prisma.PrismaPromise<unknown>[] {
  const delta = Math.round((newStart.getTime() - oldStart.getTime()) / DAY_MS) * DAY_MS;
  if (delta === 0) return [];
  const shift = (d: Date | null) => (d ? new Date(d.getTime() + delta) : null);
  return services
    .filter((s) => s.checkIn || s.checkOut)
    .map((s) =>
      prisma.bookingService.update({
        where: { id: s.id },
        data: { checkIn: shift(s.checkIn), checkOut: shift(s.checkOut) },
      }),
    );
}

const hotelServicesSelect = {
  where: { kind: "HOTEL" },
  select: { id: true, checkIn: true, checkOut: true },
} satisfies Prisma.Booking$servicesArgs;

/**
 * Lead → booking. Returns the ops (for the caller's transaction) that bring
 * the lead (when `includeLead`) and, once converted, its booking in
 * line with `facts`. The booking only follows while its services are unlocked
 * — locked services/invoice keep what they were locked with.
 *
 * `includeLead: false` when the caller is already writing the lead.
 */
export async function tripSyncOps(
  leadId: string,
  facts: TripFacts,
  { includeLead = true }: { includeLead?: boolean } = {},
): Promise<Prisma.PrismaPromise<unknown>[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      status: true,
      name: true,
      phone: true,
      startDate: true,
      endDate: true,
      adults: true,
      children: true,
      booking: {
        select: {
          id: true,
          travelDate: true,
          travelEndDate: true,
          guestName: true,
          guestPhone: true,
          travellers: true,
          servicesLocked: true,
          deletedAt: true,
          services: hotelServicesSelect,
        },
      },
    },
  });
  if (!lead) return [];

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  const datesGiven = facts.start !== undefined;
  const end = facts.end ?? null;
  if (includeLead) {
    const leadData: Prisma.LeadUpdateInput = {};
    if (datesGiven && !(sameDay(lead.startDate, facts.start) && sameDay(lead.endDate, end))) {
      const days = daysBetween(facts.start, end);
      Object.assign(leadData, { startDate: facts.start, endDate: end, ...(days ? { days } : {}) });
    }
    if (facts.name !== undefined && facts.name !== lead.name) leadData.name = facts.name;
    if (facts.phone !== undefined && facts.phone !== lead.phone) leadData.phone = facts.phone;
    if (facts.adults !== undefined && facts.adults !== lead.adults) leadData.adults = facts.adults;
    if (facts.children !== undefined && facts.children !== lead.children)
      leadData.children = facts.children;
    if (Object.keys(leadData).length > 0) {
      ops.push(prisma.lead.update({ where: { id: leadId }, data: leadData }));
    }
  }

  const b = lead.status === "CONVERTED" ? lead.booking : null;
  if (!b || b.deletedAt || b.servicesLocked) return ops;

  const data: Prisma.BookingUpdateInput = {};
  if (datesGiven && !(sameDay(b.travelDate, facts.start) && sameDay(b.travelEndDate, end))) {
    data.travelDate = facts.start;
    data.travelEndDate = end;
    ops.push(...hotelShiftOps(b.services, b.travelDate, facts.start!));
  }
  if (facts.name !== undefined && facts.name !== b.guestName) data.guestName = facts.name;
  if (facts.phone !== undefined && facts.phone !== b.guestPhone) data.guestPhone = facts.phone;
  if (facts.adults !== undefined || facts.children !== undefined) {
    const adults = facts.adults ?? lead.adults;
    const children = facts.children !== undefined ? facts.children : lead.children;
    const travellers = adults + (children ?? 0);
    if (travellers !== b.travellers) data.travellers = travellers;
  }
  if (Object.keys(data).length > 0) {
    ops.push(prisma.booking.update({ where: { id: b.id }, data }));
  }
  return ops;
}

/**
 * Booking → lead + itinerary, after the booking's Edit details changed any of
 * name / phone / dates / travellers. The lead and its itinerary follow even if
 * locked: the booking is only editable while its services are unlocked, and
 * after that it is the record of the trip. A direct website booking's own
 * itinerary follows the same way. Also moves the hotel services' dates.
 */
export async function bookingToLeadOps(
  bookingId: string,
  next: { start: Date; end: Date | null; name: string; phone: string; travellers: number },
  actor: { id: string; name: string },
): Promise<Prisma.PrismaPromise<unknown>[]> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      travelDate: true,
      services: hotelServicesSelect,
      itinerary: { select: { id: true, data: true, locked: true } },
      leads: {
        take: 1,
        select: {
          id: true,
          name: true,
          phone: true,
          adults: true,
          children: true,
          startDate: true,
          endDate: true,
          itinerary: { select: { id: true, data: true, locked: true } },
        },
      },
    },
  });
  if (!booking) return [];

  const ops: Prisma.PrismaPromise<unknown>[] = hotelShiftOps(
    booking.services,
    booking.travelDate,
    next.start,
  );

  const lead = booking.leads[0];
  // Travellers is one number on the booking; the lead keeps its children
  // count and takes the rest as adults.
  const children = lead?.children ?? null;
  const adults = Math.max(1, next.travellers - (children ?? 0));

  if (lead) {
    const days = daysBetween(next.start, next.end);
    const changed =
      lead.name !== next.name ||
      lead.phone !== next.phone ||
      lead.adults !== adults ||
      !sameDay(lead.startDate, next.start) ||
      !sameDay(lead.endDate, next.end);
    if (changed) {
      ops.push(
        prisma.lead.update({
          where: { id: lead.id },
          data: {
            name: next.name,
            phone: next.phone,
            adults,
            startDate: next.start,
            endDate: next.end,
            ...(days ? { days } : {}),
          },
        }),
      );
    }
  }

  const itin = lead?.itinerary ?? booking.itinerary;
  if (itin) {
    ops.push(
      ...(await leadFactsItineraryOps(
        itin,
        {
          name: next.name,
          phone: next.phone,
          // null keeps the itinerary's own package type.
          tourTitle: null,
          adults,
          children,
          startDate: next.start,
          endDate: next.end,
        },
        actor,
        { ignoreLock: true },
      )),
    );
  }
  return ops;
}
