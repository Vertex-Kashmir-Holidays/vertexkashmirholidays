import { z } from "zod";

/**
 * Single source of truth for the itinerary document shape.
 * Every repeatable row carries a stable `id` so React keys and immutable
 * updates are reliable. The same zod schema validates on the client (editor)
 * and on the server (API), so persisted JSON can never drift from the type.
 */

export const metaSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
});

export const daySchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  image: z.string(), // path under /itinerary/*.webp, an /uploads/* path, or a full URL
  meta: z.array(metaSchema),
});

export const hotelSchema = z.object({
  id: z.string(),
  destination: z.string(),
  hotelDetails: z.string(),
  nights: z.string(),
  roomType: z.string(),
});

export const infoSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  icon: z.string(), // key into ITINERARY_ICONS
});

export const trustSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  icon: z.string(), // key into ITINERARY_ICONS
});

export const itineraryDataSchema = z.object({
  // Cover
  coverTitle: z.string(),
  subtitle: z.string(),
  duration: z.string(),
  preparedFor: z.string(),
  travelDates: z.string(),
  travelers: z.string(),
  packageType: z.string(),
  totalCost: z.string(),
  coverImage: z.string(),

  // Destinations + info bar
  destinations: z.string(),
  info: z.array(infoSchema),

  // Daily plan
  days: z.array(daySchema),

  // Accommodation + trust strip
  hotels: z.array(hotelSchema),
  trust: z.array(trustSchema),

  // Transport
  transportType: z.string(),
  transportDesc: z.string(),
  transportImage: z.string(),

  // Lists
  inc: z.array(z.string()),
  exc: z.array(z.string()),
  pay: z.array(z.string()),
  cancel: z.array(z.string()),
});

export type ItineraryMeta = z.infer<typeof metaSchema>;
export type ItineraryDay = z.infer<typeof daySchema>;
export type HotelRow = z.infer<typeof hotelSchema>;
export type InfoItem = z.infer<typeof infoSchema>;
export type TrustItem = z.infer<typeof trustSchema>;
export type ItineraryData = z.infer<typeof itineraryDataSchema>;

export type ItineraryStatus = "DRAFT" | "SENT" | "CONFIRMED";

/** Light record used by the list view (no heavy `data` blob). */
export interface ItinerarySummary {
  id: string;
  title: string;
  status: ItineraryStatus;
  ownerId: string;
  ownerName?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/** Full record returned by GET /api/itineraries/[id]. */
export interface ItineraryRecord extends ItinerarySummary {
  data: ItineraryData;
}

/**
 * Curated, pre-compressed local stock imagery (public/itinerary/*.webp).
 * Shown in the editor's image picker; the PDF re-encodes the chosen image to
 * a small JPEG at export time (react-pdf cannot embed WebP).
 */
export const STOCK_IMAGES: { src: string; label: string }[] = [
  { src: "/itinerary/srinagar.webp", label: "Srinagar" },
  { src: "/itinerary/gulmarg.webp", label: "Gulmarg" },
  { src: "/itinerary/gulmarg-winter.webp", label: "Gulmarg (Winter)" },
  { src: "/itinerary/pahalgam.webp", label: "Pahalgam" },
  { src: "/itinerary/pahalgam2.webp", label: "Pahalgam II" },
  { src: "/itinerary/sonamarg.webp", label: "Sonamarg" },
  { src: "/itinerary/gurez.webp", label: "Gurez" },
  { src: "/itinerary/doodhpathri.webp", label: "Doodhpathri" },
  { src: "/itinerary/lidder-river.webp", label: "Lidder River" },
  { src: "/itinerary/shikara.webp", label: "Shikara / Dal Lake" },
  { src: "/itinerary/hero.webp", label: "Kashmir Valley" },
];

/** Simple incrementing-ish unique id for new rows (client-side only). */
export function genId(prefix = "it"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
