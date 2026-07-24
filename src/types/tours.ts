// Serializable shapes passed from the tours page (server) to its client sections.

import type { LucideIcon } from "lucide-react";
import type { HomeTourData } from "./home";

export interface TourListItemData extends HomeTourData {
  category: string; // TourCategory enum value: HONEYMOON | FAMILY | ADVENTURE | LUXURY
  region: string; // TourRegion enum value: KASHMIR | LADAKH
  durationDays: number;
}

export type TourSortOption = "popular" | "price-asc" | "price-desc" | "rating";

export interface CategoryOption {
  id: string;
  label: string;
  Icon: LucideIcon;
  count: number;
}

export interface DurationOption {
  id: string;
  label: string;
  count: number;
}

// ── Tour Detail — extended content shapes ──────────────────────────────────
// These mirror the JSON stored in the matching `Tour.<field>` string columns
// (parsed/serialized via src/lib/tours/content.ts). Keeping the types here
// means the admin form and the public page agree on one shape.

export interface TourItineraryDay {
  day: number;
  title: string;
  description?: string;
  image?: string;
  meals?: string;
  stay?: string;
  travelTips?: string;
}

export interface AccommodationEntry {
  location: string;
  description: string;
}

export interface BudgetRow {
  category: string;
  perPerson: string;
  perFamily: string;
  note?: string;
}

export interface PersonalExpenseRow {
  activity: string;
  cost: string;
  mandatory: boolean;
}

export interface PackingItem {
  item: string;
  reason: string;
  mandatory: boolean;
}

export interface ImportantNote {
  text: string;
  reviewNote?: string;
}

export interface RelatedTourEntry {
  tourId: string;
  ctaSentence: string;
}
