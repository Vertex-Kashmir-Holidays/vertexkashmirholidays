import { genId, type ItineraryMeta } from "@/types/itinerary";

// The last day of an itinerary is the departure: it carries a "Drop" detail
// (shown with the drop icon, which is keyed off the label) instead of "Stay".
// Applied whenever days are added, removed or reordered, so the Drop detail
// always sits on whichever day is last.

const DEFAULT_DROP = "Srinagar Airport";
const DEFAULT_STAY = "Srinagar";
const is = (m: ItineraryMeta, label: string) => m.label.trim().toLowerCase() === label;

export function withDropOnLastDay<T extends { meta: ItineraryMeta[] }>(days: T[]): T[] {
  let lastStay = DEFAULT_STAY;
  return days.map((day, i) => {
    const stay = day.meta.find((m) => is(m, "stay"));
    if (stay?.value.trim()) lastStay = stay.value;

    if (i === days.length - 1) {
      if (day.meta.some((m) => is(m, "drop"))) return day;
      const meta = stay
        ? day.meta.map((m) => (m === stay ? { ...m, label: "Drop", value: DEFAULT_DROP } : m))
        : [...day.meta, { id: genId("m"), label: "Drop", value: DEFAULT_DROP }];
      return { ...day, meta };
    }

    // No longer the last day: its Drop becomes a Stay at the last known place.
    if (!day.meta.some((m) => is(m, "drop"))) return day;
    const meta = stay
      ? day.meta.filter((m) => !is(m, "drop"))
      : day.meta.map((m) => (is(m, "drop") ? { ...m, label: "Stay", value: lastStay } : m));
    return { ...day, meta };
  });
}
