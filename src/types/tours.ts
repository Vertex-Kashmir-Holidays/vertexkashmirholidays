// Serializable shapes passed from the tours page (server) to its client sections.

import type { LucideIcon } from "lucide-react";
import type { HomeTourData } from "./home";

export interface TourListItemData extends HomeTourData {
  category: string; // TourCategory enum value: HONEYMOON | FAMILY | ADVENTURE | LUXURY
  region: string; // TourRegion enum value: KASHMIR | LADAKH | HIMACHAL
  durationDays: number;
  // Set on cards for ONE package option of a tour (see packageOptionCard):
  // deep link to that option, its exact 2-person price, and its icons.
  detailHref?: string;
  priceForTwo?: number | null;
  inclusions?: { transfers?: boolean; hotel?: string; meals?: boolean; shikara?: boolean };
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

// One package variant of a Tour (Tour.packageOptions) — e.g. Basic/Comfort/
// Premium/Luxury. All variants share the tour's itinerary; they differ in
// stay/services and price. Only the public price for 2 persons is stored —
// pricing for other group sizes is quoted by Sales, never computed here.
export interface TourPackageOption {
  id: string;
  name: string;
  image?: string;
  hotel: string;
  stay?: string;
  transport: string;
  meals: string;
  inclusions: string[];
  priceForTwo: number;
  published: boolean;
}
