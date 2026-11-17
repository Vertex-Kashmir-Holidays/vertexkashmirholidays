// Travel dates and hotel stay dates for itineraries — pure (no DB), so the
// editors, the PDF and the server sync all use the same rules.
//
// Day dates and hotel check-in / check-out are calendar dates ("2026-06-10").
// They follow the trip: Day 1 is the travel start date, the first hotel checks
// in on it and each next hotel checks in when the previous one checks out.
// resyncTripDates() / resyncDayDates() re-apply that whenever the start date,
// the days, a hotel's nights or the hotel order changes. Blank = not printed.
import type { ItineraryData } from "@/types/itinerary";

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

const pad = (n: number) => String(n).padStart(2, "0");

/** UTC-midnight Date (how lead/booking dates are stored) → "2026-06-10". */
export function toStayDate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** "2026-06-10" → UTC-midnight Date (a DATE column), or null for anything else. */
export function stayDateToDate(value: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : null;
}

type Hotel = ItineraryData["hotels"][number];

/** Hotels back-to-back from `start`: each checks in when the previous checks out. */
export function fillHotelDates(hotels: Hotel[], start: Date): Hotel[] {
  let cursor = start.getTime();
  return hotels.map((h) => {
    const nights = Math.max(0, parseInt(h.nights, 10) || 0);
    const checkIn = new Date(cursor);
    cursor += nights * 86_400_000;
    return { ...h, checkIn: toStayDate(checkIn), checkOut: toStayDate(new Date(cursor)) };
  });
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

type Day = { id: string; dateLabel: string };

/** Day 1 on `start`, each next day one calendar day later. */
export function fillDayDates<D extends Day>(days: D[], start: Date): D[] {
  return days.map((d, i) => ({ ...d, dateLabel: toStayDate(new Date(start.getTime() + i * DAY_MS)) }));
}

const dayKey = (days: Day[]) => days.map((d) => d.id).join("|");
const stayKey = (hotels: Hotel[]) => hotels.map((h) => `${h.id}:${h.nights}`).join("|");
const sameStart = (prev: { travelDates: string } | null, start: Date) =>
  prev != null && parseTravelDates(prev.travelDates)?.start.getTime() === start.getTime();

/**
 * Day dates follow the travel start date (proposal and itinerary alike):
 * re-filled when the start date or the days' order/count changes, or any day
 * has no calendar date yet. Untouched when the start date can't be read —
 * then a blank day date simply isn't printed.
 */
export function resyncDayDates<T extends { travelDates: string; days: Day[] }>(
  prev: T | null,
  next: T,
): T {
  const start = parseTravelDates(next.travelDates)?.start;
  if (!start || next.days.length === 0) return next;
  const settled =
    sameStart(prev, start) &&
    dayKey(prev!.days) === dayKey(next.days) &&
    next.days.every((d) => ISO.test(d.dateLabel));
  return settled ? next : { ...next, days: fillDayDates(next.days, start) };
}

/**
 * An itinerary's day dates and hotel check-in/out, re-filled from the travel
 * start date when it, the days, or the hotels' nights/order change (or a date
 * is missing). A date staff adjust by hand stays until one of those changes.
 */
export function resyncTripDates(prev: ItineraryData | null, next: ItineraryData): ItineraryData {
  const withDays = resyncDayDates(prev, next);
  const start = parseTravelDates(next.travelDates)?.start;
  if (!start || next.hotels.length === 0) return withDays;
  const settled =
    sameStart(prev, start) &&
    stayKey(prev!.hotels) === stayKey(next.hotels) &&
    next.hotels.every((h) => ISO.test(h.checkIn) && ISO.test(h.checkOut));
  return settled ? withDays : { ...withDays, hotels: fillHotelDates(withDays.hotels, start) };
}
