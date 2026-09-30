"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { ImageField } from "@/components/admin/pages/ImageField";
import {
  STANDARD_TIERS,
  STAY_TYPES,
  STAY_TYPE_LABELS,
  hotelsForStay,
  type OfferHotel,
  type OfferStay,
} from "@/lib/offers/content";
import type { DestinationOption } from "./OfferDaysEditor";
import type { CatalogHotel } from "@/lib/offers/hotelCatalog";
import { autoFillHotels } from "@/lib/offers/hotelAutofill";
import { toast } from "sonner";

// Stay plans of an Occasion Offer (Budget / 3-Star / 4-Star / 5-Star …) —
// marketing edits prices and stays here, no code change needed. Every plan
// follows the same day-by-day route; what differs is where each night is
// spent. Prices are whole rupees and always the TOTAL for 2 adults. List
// order = public card order.

export interface PackageDraft {
  /** Client-only React key. */
  key: string;
  /** DB id — absent for a plan added in this session. */
  id?: string;
  name: string;
  displayName: string;
  description: string;
  priceForTwo: string;
  originalPriceForTwo: string;
  published: boolean;
  image: string;
  /** One per line. */
  highlights: string;
  /** One per line. */
  inclusions: string;
  stays: OfferStay[];
  hotels: OfferHotel[];
  /** Value per offer compare row id — see OfferCompareRowsEditor. */
  compareValues: Record<string, string>;
  badge: string;
  mealPlan: string;
  vehicle: string;
}

export const emptyStay = (): OfferStay => ({
  destination: "",
  stayType: "HOTEL",
  category: "",
});

const emptyHotel = (init: Partial<OfferHotel> = {}): OfferHotel => ({
  destination: "",
  stayType: "HOTEL",
  name: "",
  category: "",
  googleUrl: "",
  rating: 0,
  reviewCount: 0,
  location: "",
  image: "",
  ...init,
});

let seq = 0;
export const newPackageDraft = (init: Partial<PackageDraft> = {}): PackageDraft => ({
  key: `new-${++seq}`,
  name: "",
  displayName: "",
  description: "",
  priceForTwo: "",
  originalPriceForTwo: "",
  published: true,
  image: "",
  highlights: "",
  inclusions: "",
  stays: [],
  hotels: [],
  compareValues: {},
  badge: "",
  mealPlan: "",
  vehicle: "",
  ...init,
});

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** Pads (never trims) a plan's stays to `nights` rows. */
const padStays = (stays: OfferStay[], nights: number) =>
  stays.length >= nights
    ? stays
    : [...stays, ...Array.from({ length: nights - stays.length }, emptyStay)];

/** Draft → API payload row (src/lib/offers/content.ts → offerPackageInputSchema). */
export const packagePayload = (p: PackageDraft, nights: number | null) => ({
  ...(p.id ? { id: p.id } : {}),
  name: p.name,
  displayName: p.displayName || p.name,
  description: p.description,
  priceForTwo: Number(p.priceForTwo || 0),
  originalPriceForTwo: p.originalPriceForTwo ? Number(p.originalPriceForTwo) : null,
  published: p.published,
  image: p.image,
  highlights: lines(p.highlights),
  inclusions: lines(p.inclusions),
  stays: nights ? padStays(p.stays, nights) : p.stays,
  hotels: p.hotels,
  compareValues: p.compareValues,
  badge: p.badge,
  mealPlan: p.mealPlan,
  vehicle: p.vehicle,
});

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";
const cellCls =
  "w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";
const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

function StaysEditor({
  stays,
  nights,
  nightLabel,
  destinations,
  onChange,
}: {
  stays: OfferStay[];
  nights: number | null;
  nightLabel: (index: number) => string | null;
  destinations: DestinationOption[];
  onChange: (next: OfferStay[]) => void;
}) {
  if (!nights) {
    return (
      <p className="text-[12px] text-muted-foreground">
        Set the offer dates to add this plan&apos;s night-by-night stays.
      </p>
    );
  }
  const rows = padStays(stays, nights);
  const update = (i: number, patch: Partial<OfferStay>) =>
    onChange(rows.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-muted-foreground">
        One row per night ({nights}): where the night is spent. The hotels themselves are added
        below under Hotel options; the class is shown when a place has no options.
      </p>
      {rows.map((s, i) => {
        const extra = i >= nights;
        return (
          <div
            key={i}
            className={`rounded-xl border p-3 ${extra ? "border-amber-500/50 bg-amber-500/5" : "border-border"}`}
          >
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-foreground">
              <span>
                Night {i + 1}
                {nightLabel(i) && (
                  <span className="ml-1.5 font-medium text-muted-foreground">{nightLabel(i)}</span>
                )}
              </span>
              {extra && (
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  className="font-semibold text-amber-700 hover:underline dark:text-amber-300"
                >
                  Outside the dates — remove
                </button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                aria-label="Place"
                value={s.destination}
                onChange={(e) => update(i, { destination: e.target.value })}
                className={cellCls}
              >
                <option value="">Place…</option>
                {destinations.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Stay type"
                value={s.stayType}
                onChange={(e) => update(i, { stayType: e.target.value as OfferStay["stayType"] })}
                className={cellCls}
              >
                {STAY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {STAY_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <input
                aria-label="Class"
                value={s.category}
                onChange={(e) => update(i, { category: e.target.value })}
                className={cellCls}
                placeholder="Class, e.g. 4-Star / Deluxe"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HotelsEditor({
  planName,
  hotels,
  stays,
  destinations,
  catalog,
  onChange,
}: {
  planName: string;
  hotels: OfferHotel[];
  stays: OfferStay[];
  destinations: DestinationOption[];
  catalog: CatalogHotel[];
  onChange: (next: OfferHotel[]) => void;
}) {
  // Hotel Rates entries not already added, grouped by their Hotel Rates place.
  const available = catalog.filter(
    (c) => !hotels.some((h) => h.name === c.name && h.destination === c.destination),
  );
  const sources = [...new Set(available.map((c) => c.source))];
  const addFromCatalog = (id: string) => {
    const pick = catalog.find((c) => c.id === id);
    if (!pick) return;
    const { id: _id, source: _source, classRank: _rank, onWebsite: _web, ...hotel } = pick;
    onChange([...hotels, hotel]);
  };
  const autoFill = () => {
    const result = autoFillHotels(planName, stays, hotels, catalog);
    onChange(result.hotels);
    toast[result.added ? "success" : "info"](
      result.added
        ? `Added ${result.added} hotel option${result.added === 1 ? "" : "s"} from Hotel Rates — review, then save.`
        : "Every place already has options, or Hotel Rates has no more hotels for them.",
    );
  };
  const update = (i: number, patch: Partial<OfferHotel>) =>
    onChange(hotels.map((h, j) => (j === i ? { ...h, ...patch } : h)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...hotels];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const name = (slug: string) => destinations.find((d) => d.slug === slug)?.name ?? slug;

  // Places this plan sleeps in (from its nights) and how many options each has.
  const places = stays
    .filter((s) => s.destination)
    .filter(
      (s, i, all) =>
        all.findIndex((x) => x.destination === s.destination && x.stayType === s.stayType) === i,
    );

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-muted-foreground">
        Add 3–4 hotels for each place this plan stays in — they&apos;re shown publicly as{" "}
        <b>Verified</b> options (so only add hotels your team has verified and can book), followed
        by an “or similar” card, with a note that the final hotel depends on availability. Copy the
        rating and review count exactly from the hotel&apos;s Google profile (leave blank to hide);
        the card opens that profile in a new tab.
      </p>
      {places.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {places.map((s) => {
            const count = hotelsForStay(s, hotels).length;
            return (
              <button
                key={`${s.destination}-${s.stayType}`}
                type="button"
                onClick={() =>
                  onChange([
                    ...hotels,
                    emptyHotel({
                      destination: s.destination,
                      stayType: s.stayType,
                      category: s.category,
                    }),
                  ])
                }
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${count ? "border-border text-muted-foreground" : "border-amber-500/50 text-amber-700 dark:text-amber-300"}`}
                title="Add a hotel option for this place"
              >
                + {name(s.destination)} {STAY_TYPE_LABELS[s.stayType].toLowerCase()} · {count}{" "}
                option{count === 1 ? "" : "s"}
              </button>
            );
          })}
        </div>
      )}
      {hotels.map((h, i) => (
        <div key={i} className="rounded-xl border border-border p-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select
              aria-label="Place"
              value={h.destination}
              onChange={(e) => update(i, { destination: e.target.value })}
              className={cellCls}
            >
              <option value="">Place…</option>
              {destinations.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Stay type"
              value={h.stayType}
              onChange={(e) => update(i, { stayType: e.target.value as OfferHotel["stayType"] })}
              className={cellCls}
            >
              {STAY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {STAY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === hotels.length - 1}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(hotels.filter((_, j) => j !== i))}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                aria-label="Remove hotel"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              aria-label="Hotel name"
              value={h.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className={cellCls}
              placeholder="Hotel name"
            />
            <input
              aria-label="Class"
              value={h.category}
              onChange={(e) => update(i, { category: e.target.value })}
              className={cellCls}
              placeholder="Class, e.g. 4-Star"
            />
            <input
              aria-label="Google profile link"
              value={h.googleUrl}
              onChange={(e) => update(i, { googleUrl: e.target.value })}
              className={cellCls}
              placeholder="https://maps.app.goo.gl/…"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              aria-label="Location"
              value={h.location}
              onChange={(e) => update(i, { location: e.target.value })}
              className={cellCls}
              placeholder="Area, e.g. Boulevard Road, Dal Lake"
            />
            <input
              aria-label="Google rating"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={h.rating || ""}
              onChange={(e) => update(i, { rating: Number(e.target.value) || 0 })}
              className={cellCls}
              placeholder="Google rating, e.g. 4.3"
            />
            <input
              aria-label="Google review count"
              type="number"
              min={0}
              step={1}
              value={h.reviewCount || ""}
              onChange={(e) => update(i, { reviewCount: Number(e.target.value) || 0 })}
              className={cellCls}
              placeholder="No. of Google reviews"
            />
          </div>
          <details>
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Photo (defaults to the place&apos;s photo)
            </summary>
            <div className="mt-2">
              <ImageField
                value={h.image}
                onChange={(url) => update(i, { image: url })}
                folder="offers"
              />
            </div>
          </details>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {catalog.length > 0 && stays.some((st) => st.destination) && (
          <button
            type="button"
            onClick={autoFill}
            className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            Auto-fill 3–4 per place from Hotel Rates
          </button>
        )}
        {available.length > 0 && (
          <select
            aria-label="Add from Hotel Rates"
            value=""
            onChange={(e) => addFromCatalog(e.target.value)}
            className={`${cellCls} w-auto max-w-full`}
          >
            <option value="">+ Add from Hotel Rates…</option>
            {sources.map((source) => (
              <optgroup key={source} label={source}>
                {available
                  .filter((c) => c.source === source)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.category}
                      {c.rating ? ` · ★${c.rating.toFixed(1)}` : ""}
                      {c.onWebsite ? " · on website" : ""}
                      {c.image ? "" : " · no photo"}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => onChange([...hotels, emptyHotel()])}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Add hotel manually
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Picking a Hotel Rates hotel fills in its photo, Google link, location and rating. Auto-fill
        matches each place by the plan&apos;s class (topping up from the nearest class when fewer
        than 3 exist) and keeps options you&apos;ve already added. Hotels without a cover photo show
        the place&apos;s photo — add one in Hotel Rates.
      </p>
    </div>
  );
}

export function OfferPackagesEditor({
  value,
  onChange,
  nights,
  nightLabel,
  destinations,
  catalog,
}: {
  value: PackageDraft[];
  onChange: (next: PackageDraft[]) => void;
  nights: number | null;
  nightLabel: (index: number) => string | null;
  destinations: DestinationOption[];
  catalog: CatalogHotel[];
}) {
  const update = (key: string, patch: Partial<PackageDraft>) =>
    onChange(value.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...value];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-muted-foreground">
        Prices are the <strong>total for 2 adults</strong>, in whole rupees. Changes go live on the
        public page as soon as you save. Hidden plans stay here but aren&apos;t shown.
      </p>

      {value.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No plans yet.{" "}
          <button
            type="button"
            onClick={() => onChange(STANDARD_TIERS.map((t) => newPackageDraft({ ...t })))}
            className="font-semibold text-primary hover:underline"
          >
            Add the standard Comfort / 3-Star / 4-Star / 5-Star plans
          </button>{" "}
          and fill in their prices and stays.
        </div>
      )}

      {value.map((p, i) => (
        <details
          key={p.key}
          open={value.length === 1}
          className="group rounded-2xl border border-border"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4">
            <span className="text-sm font-bold text-foreground">
              {i + 1}. {p.displayName || p.name || "New plan"}
              {p.priceForTwo && (
                <span className="ml-2 font-medium text-muted-foreground">
                  ₹{Number(p.priceForTwo).toLocaleString("en-IN")}
                </span>
              )}
              {!p.published && (
                <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                  Hidden
                </span>
              )}
            </span>
            <span className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x.key !== p.key))}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                aria-label="Remove plan"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </summary>

          <div className="space-y-4 border-t border-border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Plan name * (form + CRM)</label>
                <input
                  value={p.name}
                  onChange={(e) => update(p.key, { name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 4-Star"
                />
              </div>
              <div>
                <label className={labelCls}>Display name (card heading)</label>
                <input
                  value={p.displayName}
                  onChange={(e) => update(p.key, { displayName: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 4-Star Comfort"
                />
              </div>
              <div>
                <label className={labelCls}>Price for 2 adults (₹) *</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={p.priceForTwo}
                  onChange={(e) => update(p.key, { priceForTwo: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. 45000"
                />
              </div>
              <div>
                <label className={labelCls}>Original price for 2 adults (₹, optional)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={p.originalPriceForTwo}
                  onChange={(e) => update(p.key, { originalPriceForTwo: e.target.value })}
                  className={inputCls}
                  placeholder="Shown struck through — only if genuine"
                />
              </div>
              <div>
                <label className={labelCls}>Meals</label>
                <input
                  value={p.mealPlan}
                  onChange={(e) => update(p.key, { mealPlan: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Breakfast & dinner"
                />
              </div>
              <div>
                <label className={labelCls}>Transport</label>
                <input
                  value={p.vehicle}
                  onChange={(e) => update(p.key, { vehicle: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Private sedan"
                />
              </div>
              <div>
                <label className={labelCls}>Badge (optional)</label>
                <input
                  value={p.badge}
                  onChange={(e) => update(p.key, { badge: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Most booked — only if true"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Positioning — why choose this plan</label>
              <textarea
                value={p.description}
                onChange={(e) => update(p.key, { description: e.target.value })}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className={labelCls}>Stays, night by night</label>
              <StaysEditor
                stays={p.stays}
                nights={nights}
                nightLabel={nightLabel}
                destinations={destinations}
                onChange={(stays) => update(p.key, { stays })}
              />
            </div>

            <div>
              <label className={labelCls}>Hotel options</label>
              <HotelsEditor
                planName={p.name}
                hotels={p.hotels}
                stays={p.stays}
                destinations={destinations}
                catalog={catalog}
                onChange={(hotels) => update(p.key, { hotels })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>What&apos;s different (one per line)</label>
                <textarea
                  value={p.highlights}
                  onChange={(e) => update(p.key, { highlights: e.target.value })}
                  rows={4}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Plan-only inclusions (one per line)</label>
                <textarea
                  value={p.inclusions}
                  onChange={(e) => update(p.key, { inclusions: e.target.value })}
                  rows={4}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Card image (optional — defaults to the first stay&apos;s photo)
              </label>
              <ImageField
                value={p.image}
                onChange={(url) => update(p.key, { image: url })}
                folder="offers"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <input
                type="checkbox"
                checked={p.published}
                onChange={(e) => update(p.key, { published: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              Show on the public page
            </label>
          </div>
        </details>
      ))}

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([...value, newPackageDraft()])}
          className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" /> Add plan
        </button>
      )}
    </div>
  );
}
