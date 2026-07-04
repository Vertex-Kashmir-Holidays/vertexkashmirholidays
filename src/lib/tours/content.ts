// Centralized parse/serialize helpers for the string-encoded JSON columns on
// Tour. Both the admin edit page and the public tour detail page import from
// here instead of keeping their own local JSON.parse/try-catch copies.
import type {
  AccommodationEntry,
  BudgetRow,
  ImportantNote,
  PackingItem,
  PersonalExpenseRow,
  RelatedTourEntry,
  TourItineraryDay,
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

export function stringifyList<T>(value: T[]): string {
  return JSON.stringify(value);
}
