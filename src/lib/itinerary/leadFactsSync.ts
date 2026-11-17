// Two-way sync between a lead/B2B request's trip facts and its itinerary.
//
//   lead → itinerary: leadFactsItineraryOps() overlays name, phone, dates,
//     duration, travellers and package type onto the itinerary (via
//     applyLeadFactsToItinerary), keeping days/hotels/pricing untouched.
//   itinerary → lead: leadFactsFromItinerary() reads those same cover fields
//     back. They're free text in the editor: dates are read in the common
//     hand-typed forms (parseTravelDates), name/phone/travellers only in the
//     format applyLeadFactsToItinerary writes; anything else is left alone
//     rather than guessed at.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { itineraryDataSchema, type ItineraryData } from "@/types/itinerary";
import { applyLeadFactsToItinerary, type LeadItinerarySeed } from "@/lib/itinerary/lead-defaults";
import { uniqueItineraryTitle } from "@/lib/itinerary/list";
import { parseTravelDates } from "@/lib/itinerary/travelDates";

/**
 * Ops that re-sync an unlocked itinerary to new lead facts (hotel dates follow
 * a new start date), or [] when the itinerary is locked, unparseable, or
 * already matches. Saves a history entry
 * and re-derives the standard title, same as a manual save.
 */
export async function leadFactsItineraryOps(
  itin: { id: string; data: unknown; locked: boolean },
  facts: LeadItinerarySeed,
  actor: { id: string; name: string },
  /** Booking edits sync even into a locked itinerary (see bookingToLeadOps). */
  { ignoreLock = false }: { ignoreLock?: boolean } = {},
): Promise<Prisma.PrismaPromise<unknown>[]> {
  if (itin.locked && !ignoreLock) return [];
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
    next.customerPhone !== before.customerPhone ||
    JSON.stringify(next.hotels) !== JSON.stringify(before.hotels);
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

// Date parsing lives in a DB-free module so the editors can use it too.
export { parseTravelDates } from "@/lib/itinerary/travelDates";

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

  const dates = parseTravelDates(data.travelDates);
  if (dates) {
    out.startDate = dates.start;
    out.endDate = dates.end;
  }

  const pax = data.travelers.trim().match(/^(\d+) ADULTS?(?: · (\d+) (?:CHILD|CHILDREN))?$/i);
  if (pax) {
    out.adults = Number(pax[1]);
    out.children = pax[2] ? Number(pax[2]) : null;
  }
  return out;
}
