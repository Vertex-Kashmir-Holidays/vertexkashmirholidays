// Occasion Offers — shared, client-safe definitions (no prisma imports): the
// content shapes stored in OccasionOffer's JSON-string columns, the admin API
// input schema (used by the form and the route handlers alike), occasion
// labels/CTA defaults, and the trip maths every view derives from the dates:
// nights/days, per-day dates, and each plan's night split.
import { z } from "zod";
import type { OccasionType } from "@prisma/client";
import { parseJson } from "@/lib/tours/content";

export const OCCASION_TYPES = [
  "DIWALI",
  "CHRISTMAS",
  "NEW_YEAR",
  "EID",
  "HOLI",
  "SUMMER",
  "OTHER",
] as const satisfies readonly OccasionType[];

export const OCCASION_LABELS: Record<OccasionType, string> = {
  DIWALI: "Diwali",
  CHRISTMAS: "Christmas",
  NEW_YEAR: "New Year",
  EID: "Eid",
  HOLI: "Holi",
  SUMMER: "Summer",
  OTHER: "Special Offer",
};

/** Lead-form CTA when the offer has no ctaLabel of its own. */
export function defaultOfferCta(occasion: OccasionType): string {
  return occasion === "OTHER" ? "Get My Package" : `Get My ${OCCASION_LABELS[occasion]} Package`;
}

/** Tier names the "Add standard tiers" admin shortcut creates (prices left for marketing). */
export const STANDARD_TIERS = [
  { name: "Comfort", displayName: "Comfort" },
  { name: "3-Star", displayName: "3-Star" },
  { name: "4-Star", displayName: "4-Star" },
  { name: "5-Star", displayName: "5-Star" },
] as const;

/** The lead form's "no preference" choice — never stored as a package name. */
export const NOT_SURE_PACKAGE = "Not sure";

export const STAY_TYPES = ["HOTEL", "HOUSEBOAT", "RESORT", "CAMP"] as const;
export type StayType = (typeof STAY_TYPES)[number];
export const STAY_TYPE_LABELS: Record<StayType, string> = {
  HOTEL: "Hotel",
  HOUSEBOAT: "Houseboat",
  RESORT: "Resort",
  CAMP: "Camp",
};

// ── Content shapes (JSON-string columns) ────────────────────────────────────
export interface OfferPoint {
  title: string;
  text: string;
}
/** One day of the fixed-date trip; its date is startDate + index. */
export interface OfferItineraryDay {
  /** Destination slug (links + default photo). */
  destination: string;
  title: string;
  description: string;
  highlights: string[];
  /** Overrides the destination's photo. */
  image: string;
}
/** Where one night of a plan is spent; night N follows day N. */
export interface OfferStay {
  /** Destination slug. */
  destination: string;
  stayType: StayType;
  /** Class shown when the plan has no hotel options for this place, e.g. "4-Star". */
  category: string;
}
/**
 * One hotel option of a plan (2–3 per place, shown "A / B / Similar"). Matched
 * to the plan's nights by destination + stayType.
 */
export interface OfferHotel {
  destination: string;
  stayType: StayType;
  name: string;
  category: string;
  /** Google Business Profile / Maps link — opens in a new tab. */
  googleUrl: string;
  /** Copied from the Google profile — 0 = not shown. */
  rating: number;
  reviewCount: number;
  /** Area / address line, e.g. "Boulevard Road, Dal Lake". */
  location: string;
  image: string;
}
export interface OfferFaq {
  question: string;
  answer: string;
}
/** An "Optional Activities" card, e.g. Skiing — priced and booked separately. */
export interface OfferActivity {
  title: string;
  description: string;
  image: string;
  /** Free text, e.g. "From ₹2,500 per person" — blank = not shown. */
  priceNote: string;
}
/** An extra Compare Plans row, e.g. { group: "Activities", label: "Gondola ride" }. */
export interface OfferCompareRow {
  id: string;
  group: string;
  label: string;
}
/** A plan's value per compare row id — "Included", "Not included" or free text. */
export type OfferCompareValues = Record<string, string>;

export const COMPARE_INCLUDED = "Included";
export const COMPARE_NOT_INCLUDED = "Not included";
/** Suggested groups for the admin row editor (any text is allowed). */
export const COMPARE_GROUPS = ["Activities", "Transport", "Meals", "Other"] as const;
/** "Add suggested rows" in admin — values are left for marketing to set per plan. */
export const SUGGESTED_COMPARE_ROWS: Omit<OfferCompareRow, "id">[] = [
  { group: "Activities", label: "Gondola ride" },
  { group: "Activities", label: "Shikara ride" },
  { group: "Activities", label: "ATV ride" },
  { group: "Transport", label: "ABC Union (Pahalgam)" },
  { group: "Transport", label: "Sonamarg Union" },
];

const str = (max: number) => z.string().trim().max(max);
const optStr = (max: number) => str(max).optional().default("");

const pointSchema = z.object({ title: str(120), text: optStr(600) });
const daySchema = z.object({
  destination: optStr(160),
  title: optStr(160),
  description: optStr(3000),
  highlights: z
    .array(str(160))
    .max(12)
    .default([])
    .transform((h) => h.filter(Boolean)),
  image: optStr(500),
});
const staySchema = z.object({
  destination: optStr(160),
  stayType: z.enum(STAY_TYPES).default("HOTEL"),
  category: optStr(60),
});
const hotelSchema = z.object({
  destination: optStr(160),
  stayType: z.enum(STAY_TYPES).default("HOTEL"),
  name: str(160),
  category: optStr(60),
  googleUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || /^https:\/\//.test(v), "Google link must start with https://")
    .optional()
    .default(""),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  reviewCount: z.coerce.number().int().min(0).max(10_000_000).optional().default(0),
  location: optStr(160),
  image: optStr(500),
});
const faqSchema = z.object({ question: str(300), answer: str(2000) });
const activitySchema = z.object({
  title: str(120),
  description: optStr(600),
  image: optStr(500),
  priceNote: optStr(80),
});
const compareRowSchema = z.object({
  id: str(40).min(1),
  group: str(40).min(1, "Row group is required"),
  label: str(120).min(1, "Row name is required"),
});
const listSchema = z.array(str(300)).max(40);

// Blank rows (the admin editor adds empty ones) are dropped, never stored.
const nonBlank = <T extends z.ZodTypeAny>(schema: T, key: string) =>
  z
    .array(schema)
    .max(40)
    .transform((rows) =>
      rows.filter((r) => String((r as Record<string, unknown>)[key] ?? "").trim()),
    );
const nonBlankList = listSchema.transform((rows) => rows.filter(Boolean));

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z
  .string()
  .trim()
  .refine((v) => v === "" || DATE_RE.test(v), "Use YYYY-MM-DD")
  .transform((v) => (v ? new Date(`${v}T00:00:00.000Z`) : null));

const rupees = z.coerce.number().int("Whole rupees only").min(0).max(10_000_000);

export const offerPackageInputSchema = z
  .object({
    id: z.string().max(40).optional(),
    name: str(40).min(1, "Tier name is required"),
    displayName: str(80).min(1, "Display name is required"),
    description: optStr(600),
    priceForTwo: rupees.min(1, "Price is required"),
    originalPriceForTwo: rupees.nullable().optional(),
    published: z.boolean().default(true),
    image: optStr(500),
    highlights: nonBlankList,
    inclusions: nonBlankList,
    // Positional — night N — so rows are kept even when partly blank.
    stays: z.array(staySchema).max(30),
    // Values for rows that no longer exist are harmless and ignored on render.
    compareValues: z.record(z.string().max(40), str(120)).default({}),
    // Rows without a hotel name are dropped.
    hotels: z
      .array(hotelSchema)
      .max(40)
      .transform((rows) => rows.filter((h) => h.name)),
    badge: optStr(40),
    mealPlan: optStr(80),
    vehicle: optStr(80),
  })
  .refine((p) => p.originalPriceForTwo == null || p.originalPriceForTwo > p.priceForTwo, {
    message: "Original price must be higher than the offer price",
    path: ["originalPriceForTwo"],
  });

export type OfferPackageInput = z.input<typeof offerPackageInputSchema>;

const offerFields = {
  name: str(160).min(3, "Name is required"),
  slug: str(160)
    .min(3)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens only"),
  published: z.boolean(),
  sortOrder: z.coerce.number().int(),
  occasionType: z.enum(OCCASION_TYPES),
  startDate: dateField,
  endDate: dateField,
  shortDescription: optStr(400),
  heroTitle: optStr(160),
  heroSubtitle: optStr(400),
  heroImage: optStr(500),
  heroImageMobile: optStr(500),
  ctaLabel: optStr(60),
  overview: optStr(50_000),
  whyThisOffer: nonBlank(pointSchema, "title"),
  // Positional — day N — so rows are kept even when partly blank.
  itinerary: z.array(daySchema).max(31),
  inclusions: nonBlankList,
  exclusions: nonBlankList,
  gallery: nonBlankList,
  filmUrl: optStr(500),
  filmPoster: optStr(500),
  faqs: nonBlank(faqSchema, "question"),
  compareRows: z.array(compareRowSchema).max(40),
  activitiesTitle: optStr(120),
  activitiesIntro: optStr(400),
  activitiesNote: optStr(300),
  activities: nonBlank(activitySchema, "title"),
  metaTitle: optStr(160),
  metaDesc: optStr(400),
  canonicalUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Use a full https:// URL")
    .optional()
    .default(""),
  ogTitle: optStr(160),
  ogDesc: optStr(400),
  ogImage: optStr(500),
  noindex: z.boolean(),
  relatedTourIds: z.array(z.string().max(40)).max(12),
  packages: z.array(offerPackageInputSchema).max(12),
};

export const offerInputSchema = z.object(offerFields);
/** PATCH — every field optional, so e.g. Publish/Unpublish sends just `published`. */
export const offerPatchSchema = z.object(offerFields).partial();

export type OfferInput = z.output<typeof offerInputSchema>;
export type OfferPatch = z.output<typeof offerPatchSchema>;

/**
 * Reasons an offer can't be live yet — checked whenever it's saved as
 * published, so a half-filled offer (e.g. Christmas before its dates and
 * prices exist) can't reach paid traffic.
 */
export function offerPublishBlockers(o: {
  startDate: Date | null;
  endDate: Date | null;
  itineraryDays: number;
  packages: { name: string; published: boolean; priceForTwo: number; nights: number }[];
}): string[] {
  const reasons: string[] = [];
  const nights = tripNights(o.startDate, o.endDate);
  if (!o.startDate || !o.endDate) reasons.push("set the travel dates");
  else if (nights === null || nights < 1) reasons.push("the end date must be after the start date");
  if (!o.packages.some((p) => p.published && p.priceForTwo > 0)) {
    reasons.push("publish at least one priced package");
  }
  if (nights) {
    if (o.itineraryDays !== nights + 1) {
      reasons.push(`fill the itinerary for all ${nights + 1} days`);
    }
    for (const p of o.packages) {
      if (p.published && p.nights !== nights) {
        reasons.push(`give ${p.name || "each package"} a stay for all ${nights} nights`);
      }
    }
  }
  return reasons;
}

// ── Parsing (public page + admin edit page) ─────────────────────────────────
export const parseOfferPoints = (raw: string | null | undefined) =>
  parseJson<OfferPoint[]>(raw, []);
export const parseOfferItinerary = (raw: string | null | undefined) =>
  parseJson<OfferItineraryDay[]>(raw, []);
export const parseOfferStays = (raw: string | null | undefined) => parseJson<OfferStay[]>(raw, []);
export const parseOfferHotels = (raw: string | null | undefined) =>
  parseJson<OfferHotel[]>(raw, []);
export const parseOfferFaqs = (raw: string | null | undefined) => parseJson<OfferFaq[]>(raw, []);
export const parseOfferActivities = (raw: string | null | undefined) =>
  parseJson<OfferActivity[]>(raw, []);
export const parseCompareRows = (raw: string | null | undefined) =>
  parseJson<OfferCompareRow[]>(raw, []);
export const parseCompareValues = (raw: string | null | undefined) =>
  parseJson<OfferCompareValues>(raw, {});

// ── Display helpers ─────────────────────────────────────────────────────────
const dayMonthYear = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** "6 – 10 Nov 2026", "28 Dec 2026 – 2 Jan 2027", or null when dates aren't set. */
export function formatOfferDates(start: Date | null, end: Date | null): string | null {
  if (!start || !end) return start ? dayMonthYear(start) : null;
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  if (sameMonth && start.getUTCDate() === end.getUTCDate()) return dayMonthYear(start);
  if (sameMonth) return `${start.getUTCDate()} – ${dayMonthYear(end)}`;
  const startLabel = start.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
  return `${startLabel} – ${dayMonthYear(end)}`;
}

/** Date → "YYYY-MM-DD" for <input type="date">. */
export const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

// ── Trip maths (all derived from the fixed dates) ───────────────────────────
const DAY_MS = 86_400_000;

/** Nights between the dates, or null when either is missing. */
export function tripNights(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

/** "5 Nights / 6 Days" */
export function formatDuration(nights: number): string {
  const days = nights + 1;
  return `${nights} Night${nights === 1 ? "" : "s"} / ${days} Day${days === 1 ? "" : "s"}`;
}

/** "Fri, 6 Nov" for day `index` (0-based) of a trip starting on `start`. */
export function formatTripDay(start: Date, index: number): string {
  return new Date(start.getTime() + index * DAY_MS).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** Where a night is spent, as shown in splits: "Houseboat" or the destination name. */
export function stayPlaceLabel(stay: OfferStay, destinationName: (slug: string) => string) {
  return stay.stayType === "HOUSEBOAT" ? "Houseboat" : destinationName(stay.destination);
}

/**
 * A plan's nights grouped by place, in order of first appearance:
 * [{ label: "Srinagar", nights: 3 }, { label: "Pahalgam", nights: 1 }, …].
 */
export function nightSplit(
  stays: OfferStay[],
  destinationName: (slug: string) => string,
): { label: string; nights: number }[] {
  const split: { label: string; nights: number }[] = [];
  for (const stay of stays) {
    const label = stayPlaceLabel(stay, destinationName);
    const row = split.find((r) => r.label === label);
    if (row) row.nights += 1;
    else split.push({ label, nights: 1 });
  }
  return split;
}

/** "3N Srinagar · 1N Pahalgam · 1N Houseboat" */
export const formatNightSplit = (split: { label: string; nights: number }[]) =>
  split.map((r) => `${r.nights}N ${r.label}`).join(" · ");

/** A plan's hotel options for the place a night is spent. */
export const hotelsForStay = (stay: OfferStay, hotels: OfferHotel[]) =>
  hotels.filter((h) => h.destination === stay.destination && h.stayType === stay.stayType);

/** Class label for a night without hotel options, e.g. "4-Star Hotel". */
export const stayClassLabel = (stay: OfferStay) =>
  [stay.category, STAY_TYPE_LABELS[stay.stayType]].filter(Boolean).join(" ");
