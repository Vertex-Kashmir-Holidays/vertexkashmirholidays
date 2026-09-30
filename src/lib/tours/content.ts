// Centralized parse/serialize helpers for the string-encoded JSON columns on
// Tour. Both the admin edit page and the public tour detail page import from
// here instead of keeping their own local JSON.parse/try-catch copies.
import { z } from "zod";
import type {
  AccommodationEntry,
  BudgetRow,
  ImportantNote,
  PackingItem,
  PersonalExpenseRow,
  RelatedTourEntry,
  TourItineraryDay,
  TourPackageOption,
} from "@/types/tours";

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const parseItinerary = (raw: string | null | undefined): TourItineraryDay[] =>
  parseJson<TourItineraryDay[]>(raw, []);

export const parseStringList = (raw: string | null | undefined): string[] =>
  parseJson<string[]>(raw, []);

export const parseAccommodation = (raw: string | null | undefined): AccommodationEntry[] =>
  parseJson<AccommodationEntry[]>(raw, []);

export const parseBudgetRows = (raw: string | null | undefined): BudgetRow[] =>
  parseJson<BudgetRow[]>(raw, []);

export const parsePersonalExpenses = (raw: string | null | undefined): PersonalExpenseRow[] =>
  parseJson<PersonalExpenseRow[]>(raw, []);

export const parsePackingList = (raw: string | null | undefined): PackingItem[] =>
  parseJson<PackingItem[]>(raw, []);

export const parseImportantNotes = (raw: string | null | undefined): ImportantNote[] =>
  parseJson<ImportantNote[]>(raw, []);

export const parseRelatedTours = (raw: string | null | undefined): RelatedTourEntry[] =>
  parseJson<RelatedTourEntry[]>(raw, []);

export const parsePackageOptions = (raw: string | null | undefined): TourPackageOption[] =>
  parseJson<TourPackageOption[]>(raw, []);

/** Published package options only, in admin-defined order. */
export const publishedPackageOptions = (raw: string | null | undefined): TourPackageOption[] =>
  parsePackageOptions(raw).filter((o) => o.published);

/** Lowest public 2-person price among published options, or null if none. */
export function lowestPriceForTwo(raw: string | null | undefined): number | null {
  const prices = publishedPackageOptions(raw).map((o) => o.priceForTwo);
  return prices.length ? Math.min(...prices) : null;
}

// Server-authoritative shape for Tour.packageOptions (the admin form submits
// it as a JSON string, like every other list column here). Unknown keys are
// stripped, so nothing but these fields is ever stored.
export const packageOptionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(60),
  image: z.string().trim().max(1000).optional(),
  hotel: z.string().trim().min(1).max(200),
  stay: z.string().trim().max(200).optional(),
  transport: z.string().trim().min(1).max(200),
  meals: z.string().trim().min(1).max(200),
  inclusions: z.array(z.string().trim().min(1).max(200)).max(20),
  priceForTwo: z.number().positive(),
  published: z.boolean(),
});

export const packageOptionsSchema = z
  .array(packageOptionSchema)
  .max(12)
  .refine(
    (opts) => new Set(opts.map((o) => o.name.toLowerCase())).size === opts.length,
    "Package option names must be unique.",
  );

/**
 * Server-side rules for a tour's package options, applied on every tour
 * save: validate the JSON, and when any option exists force INQUIRY_ONLY (no
 * online checkout for package tours — Sales quotes the final price) and derive
 * the per-person `priceFrom` from the lowest published 2-person price.
 * Returns the fields to merge into the Prisma write, or an error message.
 */
export function applyPackageOptionRules(raw: string):
  | { ok: true; data: { packageOptions: string; formMode?: "INQUIRY_ONLY"; priceFrom?: number } }
  | {
      ok: false;
      error: string;
    } {
  const parsed = packageOptionsSchema.safeParse(parseJson<unknown>(raw, null));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid package options" };
  }
  const options = parsed.data;
  const packageOptions = JSON.stringify(options);
  if (options.length === 0) return { ok: true, data: { packageOptions } };
  const lowest = lowestPriceForTwo(packageOptions);
  return {
    ok: true,
    data: {
      packageOptions,
      formMode: "INQUIRY_ONLY",
      ...(lowest !== null ? { priceFrom: lowest / 2 } : {}),
    },
  };
}

export function stringifyList<T>(value: T[]): string {
  return JSON.stringify(value);
}
