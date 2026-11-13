// Two-way sync between a lead/B2B request's trip facts and its itinerary.
//
//   lead → itinerary: leadFactsItineraryOps() overlays name, phone, dates,
//     duration, travellers and package type onto the itinerary (via
//     applyLeadFactsToItinerary), keeping days/hotels/pricing untouched.
//   itinerary → lead: leadFactsFromItinerary() reads those same cover fields
//     back. They're free text in the editor, so only values still in the exact
//     format applyLeadFactsToItinerary writes are parsed; anything hand-typed
//     differently is left alone rather than guessed at.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { itineraryDataSchema, type ItineraryData } from "@/types/itinerary";
import { applyLeadFactsToItinerary, type LeadItinerarySeed } from "@/lib/itinerary/lead-defaults";
import { uniqueItineraryTitle } from "@/lib/itinerary/list";

/**
 * Ops that re-sync an unlocked itinerary to new lead facts, or [] when the
 * itinerary is locked, unparseable, or already matches. Saves a history entry
 * and re-derives the standard title, same as a manual save.
 */
export async function leadFactsItineraryOps(
  itin: { id: string; data: unknown; locked: boolean },
  facts: LeadItinerarySeed,
  actor: { id: string; name: string },
): Promise<Prisma.PrismaPromise<unknown>[]> {
  if (itin.locked) return [];
  const parsed = itineraryDataSchema.safeParse(itin.data);
  if (!parsed.success) return [];

  const before = parsed.data;
  const next = applyLeadFactsToItinerary(before, facts);
  const changed =
    next.preparedFor !== before.preparedFor ||
    next.travelDates !== before.travelDates ||
    next.duration !== before.duration ||
    next.travelers !== before.travelers ||
    next.packageType !== before.packageType ||
    next.customerPhone !== before.customerPhone;
  if (!changed) return [];

  const json = next as unknown as Prisma.InputJsonValue;
  // The standard name (name - duration - phone) follows the synced facts.
  const title = await uniqueItineraryTitle(next, itin.id);
  return [
    prisma.itinerary.update({
      where: { id: itin.id },
      data: { title, data: json, lastEditedById: actor.id },
    }),
    prisma.itineraryHistory.create({
      data: { itineraryId: itin.id, title, data: json, editedById: actor.id, editedByName: actor.name },
    }),
  ];
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** "12 NOV 2026" → UTC midnight, matching how lead dates are stored. */
function parseDay(d: string, mon: string, y: string): Date | null {
  const m = MONTHS.indexOf(mon.toUpperCase());
  return m < 0 ? null : new Date(Date.UTC(Number(y), m, Number(d)));
}

export interface ItineraryLeadFacts {
  name?: string;
  phone?: string;
  startDate?: Date;
  endDate?: Date | null;
  adults?: number;
  children?: number | null;
}

/** Lead fields recoverable from an itinerary's cover — see the file header. */
export function leadFactsFromItinerary(data: ItineraryData): ItineraryLeadFacts {
  const out: ItineraryLeadFacts = {};
  const name = data.preparedFor.trim();
  if (name.length >= 2) out.name = name;
  const phone = data.customerPhone.trim();
  if (phone.length >= 6) out.phone = phone;

  const dates = data.travelDates
    .trim()
    .match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})(?: - (\d{1,2}) ([A-Za-z]{3}) (\d{4}))?$/);
  if (dates) {
    const start = parseDay(dates[1], dates[2], dates[3]);
    const end = dates[4] ? parseDay(dates[4], dates[5], dates[6]) : null;
    if (start && (!dates[4] || end)) {
      out.startDate = start;
      out.endDate = end;
    }
  }

  const pax = data.travelers.trim().match(/^(\d+) ADULTS?(?: · (\d+) (?:CHILD|CHILDREN))?$/i);
  if (pax) {
    out.adults = Number(pax[1]);
    out.children = pax[2] ? Number(pax[2]) : null;
  }
  return out;
}
