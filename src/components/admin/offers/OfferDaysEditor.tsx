"use client";

import { ImageField } from "@/components/admin/pages/ImageField";
import type { OfferItineraryDay } from "@/lib/offers/content";

// Day-by-day itinerary of a fixed-date offer: exactly one row per day of the
// trip (the dates set how many), each labelled with its real date. The
// sightseeing here is shared by every plan — where each plan sleeps is set per
// plan under Packages & Pricing.

export interface DestinationOption {
  slug: string;
  name: string;
}

export const emptyDay = (): OfferItineraryDay => ({
  destination: "",
  title: "",
  description: "",
  highlights: [],
  image: "",
});

/** Pads (never trims) to `count` rows, so shortening the dates can't silently drop content. */
export function padDays(days: OfferItineraryDay[], count: number): OfferItineraryDay[] {
  return days.length >= count
    ? days
    : [...days, ...Array.from({ length: count - days.length }, emptyDay)];
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

export function OfferDaysEditor({
  value,
  onChange,
  dayCount,
  dayLabel,
  destinations,
}: {
  value: OfferItineraryDay[];
  onChange: (next: OfferItineraryDay[]) => void;
  /** nights + 1, or null until both dates are set. */
  dayCount: number | null;
  dayLabel: (index: number) => string | null;
  destinations: DestinationOption[];
}) {
  if (dayCount === null || dayCount < 2) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Set the start and end dates first (Dates &amp; Occasion) — the itinerary gets one row per
        day of the trip.
      </p>
    );
  }
  const rows = padDays(value, dayCount);
  const update = (i: number, patch: Partial<OfferItineraryDay>) =>
    onChange(rows.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        {dayCount} days. Sightseeing is shared by every plan; each plan&apos;s overnight stay per
        night is set under Packages &amp; Pricing. The day photo defaults to the destination&apos;s
        own cover image.
      </p>
      {rows.map((d, i) => {
        const extra = i >= dayCount;
        return (
          <div
            key={i}
            className={`rounded-2xl border p-4 space-y-3 ${extra ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-foreground">
                Day {i + 1}
                {dayLabel(i) && (
                  <span className="ml-2 font-medium text-muted-foreground">{dayLabel(i)}</span>
                )}
              </p>
              {extra && (
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  className="text-xs font-semibold text-amber-700 hover:underline dark:text-amber-300"
                >
                  Outside the dates — remove
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <div>
                <label className={labelCls}>Destination</label>
                <select
                  value={d.destination}
                  onChange={(e) => update(i, { destination: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {destinations.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Day title</label>
                <input
                  value={d.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Arrival in Srinagar & Dal Lake Shikara"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description (2–3 lines works best)</label>
              <textarea
                value={d.description}
                onChange={(e) => update(i, { description: e.target.value })}
                rows={3}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Highlights (one per line — first 3 show on the card)
              </label>
              <textarea
                value={d.highlights.join("\n")}
                onChange={(e) => update(i, { highlights: e.target.value.split("\n") })}
                rows={2}
                className={inputCls}
                placeholder={"e.g. Shikara ride\nMughal Gardens"}
              />
            </div>
            <div>
              <label className={labelCls}>Photo (optional)</label>
              <ImageField
                value={d.image}
                onChange={(url) => update(i, { image: url })}
                folder="offers"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
