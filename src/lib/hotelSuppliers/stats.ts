// Public read access to HotelSupplier — a private B2B rate-sheet reference
// table everywhere else in the app (admin-only). Two categories of public
// exposure exist here, deliberately kept distinct:
//  - getVerifiedPropertiesCount(*) — aggregate numbers only, never names.
//  - getPublicHotels() — individual properties, by name/image/description,
//    for the Trip Planner hotel carousel (Plan Your Kashmir Trip). Gated on
//    showOnWebsite: true — a hotel is never shown publicly by default, and
//    never exposes rate-sheet data (data.rate, bookingsCount,
//    lastRateRequestSentAt are all excluded from its select).
//
// All queries are wrapped in unstable_cache because they're read from public
// pages — same rationale as getSiteSettings() in src/lib/siteSettings.ts.
// Busted via the existing admin "flush cache" action (see src/lib/cache.ts)
// rather than on every individual supplier edit; a 30-minute fallback TTL
// covers the rest, except getPublicHotels' own shorter TTL (see below).
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hotelDataSchema, parseServices } from "@/lib/hotelSuppliers/schema";

// HotelSupplier.destination is free text (not a relation to Destination), so
// a few destinations use a different label in supplier records than the
// Destination page's own name (e.g. "Gulmarg" the destination vs "Gulmarg /
// Tangmarg" the supplier-record destination). Only list the exceptions here —
// every other destination matches by exact name already.
const DESTINATION_SUPPLIER_ALIASES: Record<string, string[]> = {
  gulmarg: ["Gulmarg / Tangmarg"],
  "gurez-valley": ["Gurez"],
  leh: ["Leh / Ladakh"],
};

export const getVerifiedPropertiesCount = unstable_cache(
  () => prisma.hotelSupplier.count({ where: { isActive: true } }),
  ["hotel-supplier-total-count"],
  { revalidate: 1800, tags: ["hotel-supplier-counts"] },
);

export const getVerifiedPropertiesCountForDestination = unstable_cache(
  (destinationSlug: string, destinationName: string) => {
    const names = [destinationName, ...(DESTINATION_SUPPLIER_ALIASES[destinationSlug] ?? [])];
    return prisma.hotelSupplier.count({
      where: { isActive: true, destination: { in: names } },
    });
  },
  ["hotel-supplier-count-by-destination"],
  { revalidate: 1800, tags: ["hotel-supplier-counts"] },
);

export interface PublicHotel {
  id: string;
  hotelName: string;
  location: string; // HotelSupplier.destination
  description: string | null; // first line(s) of data.property.services
  coverImageUrl: string;
  roomImageUrl: string | null;
  rating: string | null; // free-text, admin-entered — e.g. "4.7★ / 2,698 reviews"
  // Sourced from data.property.mapUrl — the Hotel Rates table's existing
  // "Google Maps URL" field (edited via the hotel-name cell). Confirmed
  // against real rows that this is already the correct link for a "View on
  // Google" CTA (maps.app.goo.gl/... or a maps.google.com search-by-name
  // URL, both resolving to the business's own Google listing) — no separate
  // Google Business Profile field needed.
  googleProfileUrl: string | null;
  publicLikeCount: number;
}

// Ordering reuses the existing `recommended` flag (a real, already-curated
// "push this first" signal — see HotelSupplier.recommended's own doc
// comment) rather than a new sortOrder column. hotelName as the tiebreak
// keeps the order stable and predictable for admin, not just "whatever
// Postgres returns". Only hotels with BOTH showOnWebsite and a cover image
// are shown — a hotel flagged public with no photo yet would otherwise
// render a broken/placeholder card.
export const getPublicHotels = unstable_cache(
  async (): Promise<PublicHotel[]> => {
    const rows = await prisma.hotelSupplier.findMany({
      where: { showOnWebsite: true, coverImageUrl: { not: null } },
      orderBy: [{ recommended: "desc" }, { hotelName: "asc" }],
      select: {
        id: true,
        hotelName: true,
        destination: true,
        coverImageUrl: true,
        roomImageUrl: true,
        publicLikeCount: true,
        data: true,
      },
    });

    return rows.map((row) => {
      const parsed = hotelDataSchema.safeParse(row.data);
      const services = parsed.success ? parseServices(parsed.data.property.services) : [];
      const rating = parsed.success ? parsed.data.rating : null;
      return {
        id: row.id,
        hotelName: row.hotelName,
        location: row.destination,
        // First 2 amenity lines as a short description — no true prose
        // description field exists yet (see the schema inspection notes);
        // reusing real, already-admin-entered content rather than inventing
        // a description.
        description: services.length ? services.slice(0, 2).join(" · ") : null,
        // coverImageUrl is guaranteed non-null by the where clause above.
        coverImageUrl: row.coverImageUrl as string,
        roomImageUrl: row.roomImageUrl,
        rating,
        googleProfileUrl: parsed.success ? parsed.data.property.mapUrl : null,
        publicLikeCount: row.publicLikeCount,
      };
    });
  },
  ["public-hotels-trip-planner"],
  // Shorter TTL than the count functions above: publicLikeCount changes on
  // every Like click, and a fresher carousel (admin toggling
  // showOnWebsite/reordering via `recommended`) matters more here than for a
  // slow-moving aggregate count.
  { revalidate: 300, tags: ["hotel-supplier-public"] },
);
