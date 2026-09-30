// Hotel Rates (HotelSupplier) → Occasion Offer hotel options, for the admin
// "Add from Hotel Rates" picker and "Auto-fill" (src/lib/offers/hotelAutofill.ts).
// Every active hotel is offered (the offer's verified options come from this
// list, at the business's request); hotels already approved for the website
// (showOnWebsite), recommended ones and those with a cover photo sort first.
// Only public-safe fields are copied — never rate-sheet data or contacts.
// Server-only.
import { prisma } from "@/lib/prisma";
import {
  HOTEL_CATEGORY_LABELS,
  CATEGORY_SORT_ORDER,
  hotelDataSchema,
  parseRatingValue,
  type HotelDestination,
} from "@/lib/hotelSuppliers/schema";
import type { OfferHotel } from "@/lib/offers/content";

// Hotel Rates destination → the offer's Destination slug + stay type.
// Unmapped destinations (no matching Destination page) are left out.
const PLACE: Partial<Record<HotelDestination, Pick<OfferHotel, "destination" | "stayType">>> = {
  Srinagar: { destination: "srinagar", stayType: "HOTEL" },
  Pahalgam: { destination: "pahalgam", stayType: "HOTEL" },
  "Gulmarg / Tangmarg": { destination: "gulmarg", stayType: "HOTEL" },
  Sonamarg: { destination: "sonamarg", stayType: "HOTEL" },
  Houseboats: { destination: "srinagar", stayType: "HOUSEBOAT" },
  Gurez: { destination: "gurez-valley", stayType: "HOTEL" },
  "Leh / Ladakh": { destination: "leh", stayType: "HOTEL" },
};

export interface CatalogHotel extends OfferHotel {
  id: string;
  /** Hotel Rates destination label, for grouping in the picker. */
  source: string;
  /** Hotel Rates class, 0 = Budget … 3 = 5 Star — for nearest-class fallback. */
  classRank: number;
  onWebsite: boolean;
}

/** "4.7★ / 2,698 reviews" → 2698. */
function parseReviewCount(rating: string | null | undefined): number {
  const match = rating?.split("/")[1]?.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export async function getOfferHotelCatalog(): Promise<CatalogHotel[]> {
  const rows = await prisma.hotelSupplier.findMany({
    where: { isActive: true },
    orderBy: [{ destination: "asc" }, { category: "asc" }, { hotelName: "asc" }],
    select: {
      id: true,
      hotelName: true,
      destination: true,
      category: true,
      coverImageUrl: true,
      showOnWebsite: true,
      recommended: true,
      data: true,
    },
  });
  const hotels = rows.flatMap((r) => {
    const place = PLACE[r.destination as HotelDestination];
    if (!place) return [];
    const data = hotelDataSchema.safeParse(r.data);
    const property = data.success ? data.data.property : null;
    const ratingText = data.success ? data.data.rating : null;
    const mapUrl = property?.mapUrl ?? "";
    return [
      {
        id: r.id,
        source: r.destination,
        ...place,
        name: r.hotelName.trim(),
        // Offer pages call the entry class "Comfort", not "Budget".
        category:
          r.category === "BUDGET"
            ? "Comfort"
            : HOTEL_CATEGORY_LABELS[r.category].replace(" ", "-"),
        googleUrl: mapUrl.startsWith("https://") ? mapUrl : "",
        rating: parseRatingValue(ratingText) ?? 0,
        reviewCount: parseReviewCount(ratingText),
        location: property?.location ?? "",
        image: r.coverImageUrl ?? "",
        classRank: CATEGORY_SORT_ORDER[r.category],
        onWebsite: r.showOnWebsite,
        recommended: r.recommended,
      },
    ];
  });
  // Best first within each place/class: website-approved, recommended, with a
  // photo, then by Google rating.
  const score = (h: (typeof hotels)[number]) =>
    (h.onWebsite ? 8 : 0) + (h.recommended ? 4 : 0) + (h.image ? 2 : 0);
  return hotels
    .sort((a, b) => score(b) - score(a) || b.rating - a.rating || a.name.localeCompare(b.name))
    .map(({ recommended: _r, ...h }) => h);
}
