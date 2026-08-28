// Domain schema for the Hotel Rates module — an internal supplier reference
// (NOT bookable inventory). One row per hotel, one current rate per hotel —
// Sales/Admin always maintain a single season's rate and overwrite it when
// the season changes, rather than keeping a history of past rates. `data`
// is a Json column (see prisma/schema.prisma -> HotelSupplier for why).
import { z } from "zod";

// Vertex's internal commercial classification — not the hotel's star rating.
export const HOTEL_CATEGORIES = ["BUDGET", "DELUXE", "PREMIUM"] as const;
export type HotelCategoryValue = (typeof HOTEL_CATEGORIES)[number];

export const HOTEL_CATEGORY_LABELS: Record<HotelCategoryValue, string> = {
  BUDGET: "Budget",
  DELUXE: "Deluxe",
  PREMIUM: "Premium",
};

// Display/sort order for category — Budget -> Deluxe -> Premium, cheapest first.
export const CATEGORY_SORT_ORDER: Record<HotelCategoryValue, number> = {
  BUDGET: 0,
  DELUXE: 1,
  PREMIUM: 2,
};

// Category is derived from the MAP net rate, not chosen manually — this is
// Vertex's actual commercial classification rule: <2,500 Budget, <7,000
// Deluxe, >=7,000 Premium. Recomputed every time MAP is saved. A hotel with
// no MAP figure yet defaults to Budget until a real rate is entered.
export function computeCategoryFromMap(mapNet: number | null | undefined): HotelCategoryValue {
  if (mapNet == null) return "BUDGET";
  if (mapNet < 2500) return "BUDGET";
  if (mapNet < 7000) return "DELUXE";
  return "PREMIUM";
}

// Initial destination set. Extend this array to add a destination later —
// no migration needed, `destination` is a plain filtered string column.
export const HOTEL_DESTINATIONS = [
  "Srinagar",
  "Pahalgam",
  "Gulmarg / Tangmarg",
  "Sonamarg",
  "Gurez",
  "Leh / Ladakh",
  "Kargil",
  "Katra / Vaishno Devi",
  "Uri / Kaman Setu",
] as const;
export type HotelDestination = (typeof HOTEL_DESTINATIONS)[number];

// Blank string / undefined -> null, string -> number, for optional money and
// numeric-string form fields. Same pattern as the `coord` preprocess in
// src/app/api/destinations/route.ts.
const nonNegativeMoney = z.preprocess(
  (v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v) : v),
  z.number().min(0).nullable(),
);

const dateString = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.string().nullable(),
);

const nullableText = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.string().nullable(),
);

// The one current rate for a hotel — all four meal-plan rates (MAP still
// drives the auto-computed category). Missing keys (e.g. rows saved before
// EP was added) parse to null via the nonNegativeMoney preprocess, so this
// stays backward-compatible with rates already saved.
export const rateSchema = z.object({
  validTo: dateString,
  mealPlans: z.object({
    EP: nonNegativeMoney,
    CP: nonNegativeMoney,
    MAP: nonNegativeMoney,
    AP: nonNegativeMoney,
  }),
  extraBed: nonNegativeMoney,
});
export type HotelRate = z.infer<typeof rateSchema>;

// Meal-plan abbreviation legend, shown at the top of the Hotel Rates page.
export const MEAL_PLAN_LEGEND: { code: "EP" | "CP" | "MAP" | "AP"; meaning: string }[] = [
  { code: "EP", meaning: "Room only" },
  { code: "CP", meaning: "Room + breakfast" },
  { code: "MAP", meaning: "Room + breakfast + one of lunch/dinner" },
  { code: "AP", meaning: "Room + breakfast + lunch + dinner" },
];

export const propertySchema = z.object({
  location: nullableText,
  contactPerson: nullableText,
  phone: nullableText,
  email: nullableText,
  mapUrl: nullableText,
  // One service/amenity per line (e.g. "Central heating\nCentral A/C\nBuffet
  // System"), rendered as a bullet list. Lives in the existing `data` Json
  // blob — no migration needed for a new field here.
  services: nullableText,
});
export type HotelProperty = z.infer<typeof propertySchema>;

export const hotelDataSchema = z.object({
  property: propertySchema,
  rate: rateSchema.nullable(),
  // Google rating text (e.g. "4.7★ / 2,698 reviews") shown in the Rating column.
  rating: nullableText,
});
export type HotelData = z.infer<typeof hotelDataSchema>;

export const createHotelSupplierSchema = z.object({
  hotelName: z.string().min(2, "Hotel name is required"),
  destination: z.enum(HOTEL_DESTINATIONS),
  category: z.enum(HOTEL_CATEGORIES),
  isActive: z.boolean().default(true),
  data: hotelDataSchema,
});
export type CreateHotelSupplierInput = z.infer<typeof createHotelSupplierSchema>;

export const patchHotelSupplierSchema = z.object({
  hotelName: z.string().min(2).optional(),
  destination: z.enum(HOTEL_DESTINATIONS).optional(),
  category: z.enum(HOTEL_CATEGORIES).optional(),
  isActive: z.boolean().optional(),
  data: hotelDataSchema.optional(),
});
export type PatchHotelSupplierInput = z.infer<typeof patchHotelSupplierSchema>;

// Splits the stored multiline `services` text into the bullet list shown in
// the table — one entry per non-blank line.
export function parseServices(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// True when a hotel is due for a rate-request email: no MAP rate on file, no
// valid-till date on file (can't confirm it's still current), or its
// validity has lapsed. Shared by the client (enables/disables the Send
// button) and the API route (re-checked server-side so a disabled button
// can't be bypassed from devtools).
export function rateNeedsRefresh(rate: HotelRate | null, today?: string): boolean {
  if (!rate || rate.mealPlans.MAP == null) return true;
  if (!rate.validTo) return true;
  const todayStr = today ?? new Date().toISOString().slice(0, 10);
  return rate.validTo < todayStr;
}
