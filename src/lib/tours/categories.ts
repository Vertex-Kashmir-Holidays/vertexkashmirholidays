import type { TourCategory } from "@prisma/client";

// Canonical slug + display labels for each tour category's dedicated landing
// page (/tours/category/[slug]). pageTitle is the exact phrase used as both
// the page H1 and the internal-link anchor text pointing to it (footer,
// /tours browse-by-category row) — Google's sitelinks/site-hierarchy signals
// come from consistent anchor text, not just the page existing.
export interface TourCategoryMeta {
  slug: string;
  shortLabel: string;
  pageTitle: string;
  // Card copy + emoji for the /tours/category hub grid — kept alongside the
  // rest of the category metadata rather than a separate lookup table.
  emoji: string;
  cardDescription: string;
  // <meta name="description"> for the category's own landing page
  // (/tours/category/[slug]). Deliberately distinct from cardDescription —
  // that copy is a short grid-card blurb; this is a full search-snippet
  // sentence. Each one must read as unique text, not a shared template with
  // one word swapped, or Google collapses them into the same sitelink snippet.
  metaDescription: string;
}

export const TOUR_CATEGORY_META: Record<TourCategory, TourCategoryMeta> = {
  HONEYMOON: {
    slug: "honeymoon-packages",
    shortLabel: "Honeymoon",
    pageTitle: "Honeymoon Packages",
    emoji: "❤️",
    cardDescription:
      "Perfect for couples looking for romantic stays, houseboats and private experiences.",
    metaDescription:
      "Romantic Kashmir honeymoon packages featuring luxury hotels, houseboats, private sightseeing, and unforgettable experiences for couples.",
  },
  FAMILY: {
    slug: "family-tour-packages",
    shortLabel: "Family",
    pageTitle: "Family Tour Packages",
    emoji: "👨‍👩‍👧",
    cardDescription:
      "Comfortable holidays designed for families with children and senior travellers.",
    metaDescription:
      "Book a Kashmir family tour package with comfortable hotels, private cabs, sightseeing, and flexible itineraries — perfect for a Kashmir family tour with kids, parents or grandparents of all ages.",
  },
  ADVENTURE: {
    slug: "adventure-tour-packages",
    shortLabel: "Adventure",
    pageTitle: "Adventure Tour Packages",
    emoji: "🏔",
    cardDescription:
      "Offbeat road trips to Gurez Valley, Nubra and Pangong, with private transport and acclimatisation built in.",
    metaDescription:
      "Offbeat Kashmir and Ladakh road trips — Gurez Valley, Nubra and Pangong — with private transport, acclimatisation built in and transparent pricing.",
  },
  LUXURY: {
    slug: "luxury-tour-packages",
    shortLabel: "Luxury",
    pageTitle: "Luxury Tour Packages",
    emoji: "💎",
    cardDescription:
      "Premium hotels, private vehicles and curated experiences for a five-star trip.",
    metaDescription:
      "Experience premium Kashmir luxury holidays with handpicked hotels, private transfers, personalized itineraries, and exclusive experiences.",
  },
  BUDGET: {
    slug: "budget-tour-packages",
    shortLabel: "Budget",
    pageTitle: "Budget Tour Packages",
    emoji: "🎒",
    cardDescription:
      "Well-planned itineraries that cover Kashmir's highlights without overspending.",
    metaDescription:
      "Affordable Kashmir budget tour packages covering the valley's highlights with comfortable stays, private transport, and honest, transparent pricing.",
  },
  GROUP: {
    slug: "group-tour-packages",
    shortLabel: "Group",
    pageTitle: "Group Tour Packages",
    emoji: "👥",
    cardDescription:
      "Private trips for your own group, with group-friendly hotels — great for friends and colleagues.",
    metaDescription:
      "Private Kashmir group tour packages — your own vehicle and driver, group-friendly hotels, your dates, and one transparent per-person price.",
  },
  PILGRIMAGE: {
    slug: "pilgrimage-tour-packages",
    shortLabel: "Pilgrimage",
    pageTitle: "Pilgrimage Tour Packages",
    emoji: "🛕",
    cardDescription:
      "Guided trips to Kashmir's shrines and holy sites with comfortable travel arrangements.",
    metaDescription:
      "Guided Kashmir pilgrimage tour packages to sacred shrines and holy sites with comfortable stays, private transport, and seamless travel arrangements.",
  },
  PREMIUM: {
    slug: "premium-tour-packages",
    shortLabel: "Premium",
    pageTitle: "Premium Tour Packages",
    emoji: "⭐",
    cardDescription:
      "A step above standard packages — upgraded stays and a more personalised itinerary.",
    metaDescription:
      "Elevated Kashmir premium tour packages with upgraded hotels, personalized itineraries, and a more curated travel experience than standard packages.",
  },
};

export function getCategoryBySlug(slug: string): TourCategory | null {
  const match = (Object.entries(TOUR_CATEGORY_META) as [TourCategory, TourCategoryMeta][]).find(
    ([, meta]) => meta.slug === slug,
  );
  return match ? match[0] : null;
}

// Hotel class shown on tour cards. Tour has no star-rating field, so this follows
// the hotel class each category's own page copy promises; anything else (Adventure,
// no category, non-Kashmir regions) reads plain "Hotel" rather than claiming a star.
const HOTEL_CLASS_BY_CATEGORY: Partial<Record<TourCategory, string>> = {
  BUDGET: "Standard",
  FAMILY: "Deluxe",
  GROUP: "Deluxe",
  PILGRIMAGE: "Deluxe",
  PREMIUM: "Premium",
  LUXURY: "Premium",
  HONEYMOON: "Boutique",
};

export const hotelClassLabel = (category?: string | null): string =>
  (category && HOTEL_CLASS_BY_CATEGORY[category as TourCategory]) || "Hotel";
