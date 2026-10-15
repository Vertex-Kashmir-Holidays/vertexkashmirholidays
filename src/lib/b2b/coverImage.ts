import { DEFAULT_ITINERARY_DATA } from "@/components/admin/itinerary/default-data";

/** Cover photo for a B2B itinerary until staff pick one — a neutral Kashmir
 *  scene (Dal Lake shikara at sunset), portrait, so it fills the A4 cover. */
export const B2B_DEFAULT_COVER = "/itinerary/shikara.webp";

/** The cover a B2B itinerary actually shows. Itinerary data starts life with
 *  the customer document's default cover (Vertex's own brand artwork), which
 *  must not appear on an agent-branded document — so that value, like an
 *  empty one, means "not chosen yet" and falls back to the B2B default. */
export function b2bCoverImage(coverImage: string): string {
  return !coverImage || coverImage === DEFAULT_ITINERARY_DATA.coverImage
    ? B2B_DEFAULT_COVER
    : coverImage;
}
