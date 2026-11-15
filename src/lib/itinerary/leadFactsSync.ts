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

/** "12", "Nov", "2026" → UTC midnight, matching how lead dates are stored. Null for impossible days (31 Feb). */
function parseDay(d: string, mon: string, y: string): Date | null {
  const m = MONTHS.indexOf(mon.toUpperCase().slice(0, 3));
  if (m < 0) return null;
  const date = new Date(Date.UTC(Number(y), m, Number(d)));
  return date.getUTCDate() === Number(d) ? date : null;
}

const D = "(\\d{1,2})(?:st|nd|rd|th)?";
const M = "([a-z]{3,9})\\.?";
const Y = "(\\d{4})";
const TO = "\\s*(?:-|–|—|to)\\s*";
// "12 Nov 2026" or "28 Dec 2026 - 3 Jan 2027" (the format the lead sync writes)
const FULL_RANGE = new RegExp(`^${D} ${M} ${Y}(?:${TO}${D} ${M} ${Y})?$`, "i");
// "10 - 15 Jun 2026" (proposal style)
const SAME_MONTH = new RegExp(`^${D}${TO}${D} ${M} ${Y}$`, "i");
// "28 Jun - 3 Jul 2026"
const SAME_YEAR = new RegExp(`^${D} ${M}${TO}${D} ${M} ${Y}$`, "i");

/**
 * Travel dates from the free-text cover field of a proposal / itinerary.
 * Reads the common ways staff write a date or range (see the patterns above);
 * anything else ("To be decided", "June 2026") returns null rather than a guess.
 */
export function parseTravelDates(text: string): { start: Date; end: Date | null } | null {
  const t = text.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  let start: Date | null = null;
  let end: Date | null = null;
  let m: RegExpMatchArray | null;
  if ((m = t.match(FULL_RANGE))) {
    start = parseDay(m[1], m[2], m[3]);
    if (m[4]) end = parseDay(m[4], m[5], m[6]);
    if (m[4] && !end) return null;
  } else if ((m = t.match(SAME_MONTH))) {
    start = parseDay(m[1], m[3], m[4]);
    end = parseDay(m[2], m[3], m[4]);
    if (!end) return null;
  } else if ((m = t.match(SAME_YEAR))) {
    start = parseDay(m[1], m[2], m[5]);
    end = parseDay(m[3], m[4], m[5]);
    if (!end) return null;
  }
  if (!start || (end && end < start)) return null;
  return { start, end };
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
