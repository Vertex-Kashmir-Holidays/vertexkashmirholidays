import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Dates = { start: Date; end: Date | null };

const sameDay = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null);

/**
 * Travel dates flow downstream: proposal → itinerary → lead → booking.
 * Returns the ops (for the caller's transaction) that bring the lead and, once
 * converted, its booking in line with `dates`. The booking only follows while
 * its services are unlocked — locked services/invoice keep the dates they
 * were locked with, same rule as Edit Details on the booking.
 *
 * `includeLead: false` when the caller is already writing the lead's dates.
 */
export async function travelDatesOps(
  leadId: string,
  dates: Dates,
  { includeLead = true }: { includeLead?: boolean } = {},
): Promise<Prisma.PrismaPromise<unknown>[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      status: true,
      startDate: true,
      endDate: true,
      booking: {
        select: { id: true, travelDate: true, travelEndDate: true, servicesLocked: true, deletedAt: true },
      },
    },
  });
  if (!lead) return [];

  const ops: Prisma.PrismaPromise<unknown>[] = [];
  if (includeLead && !(sameDay(lead.startDate, dates.start) && sameDay(lead.endDate, dates.end))) {
    ops.push(prisma.lead.update({ where: { id: leadId }, data: { startDate: dates.start, endDate: dates.end } }));
  }

  const booking = lead.status === "CONVERTED" ? lead.booking : null;
  if (
    booking &&
    !booking.deletedAt &&
    !booking.servicesLocked &&
    !(sameDay(booking.travelDate, dates.start) && sameDay(booking.travelEndDate, dates.end))
  ) {
    ops.push(
      prisma.booking.update({
        where: { id: booking.id },
        data: { travelDate: dates.start, travelEndDate: dates.end },
      }),
    );
  }
  return ops;
}
