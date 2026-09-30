import type { ItineraryData, ItineraryDay } from "@/types/itinerary";

// Activities point at days by free text ("Day 02"). When days are reordered,
// those labels must follow the day they describe, or the PDF ends up saying
// the Gulmarg gondola is on the wrong day. Only the exact "Day <n>" shape is
// rewritten (zero-padding preserved); anything else staff typed is left alone.
const DAY_REFERENCE = /^(\s*day\s*)(\d+)(\s*)$/i;

export function remapDayReference(text: string, dayMap: ReadonlyMap<number, number>): string {
  const match = DAY_REFERENCE.exec(text);
  if (!match) return text;
  const next = dayMap.get(Number(match[2]));
  if (next === undefined) return text;
  return `${match[1]}${String(next).padStart(match[2].length, "0")}${match[3]}`;
}

// `dateLabel` belongs to the calendar slot ("Day 2 is 11 Jun"), not to the content
// that moved into it — shared by every editor that reorders days.
export function keepDateLabelsInSlots<T extends { dateLabel: string }>(prev: T[], next: T[]): T[] {
  return next.map((day, index) => ({ ...day, dateLabel: prev[index]?.dateLabel ?? day.dateLabel }));
}

/**
 * Applies a new day order. Day numbers come from array position (editor and
 * PDF alike), so they renumber on their own; this handles the two things that
 * don't:
 *  - `dateLabel` stays with the calendar slot ("Day 2 is 11 Jun") rather than
 *    travelling with the content, so swapping days never means retyping dates.
 *  - activity `day` references are remapped to the days' new numbers.
 */
export function applyDayOrder(data: ItineraryData, nextDays: ItineraryDay[]): ItineraryData {
  const dayMap = new Map<number, number>();
  data.days.forEach((day, index) => {
    const nextIndex = nextDays.findIndex((d) => d.id === day.id);
    if (nextIndex !== -1) dayMap.set(index + 1, nextIndex + 1);
  });

  return {
    ...data,
    days: keepDateLabelsInSlots(data.days, nextDays),
    activities: data.activities.map((a) => ({ ...a, day: remapDayReference(a.day, dayMap) })),
    optionalActivities: data.optionalActivities.map((a) => ({
      ...a,
      day: remapDayReference(a.day, dayMap),
    })),
  };
}
