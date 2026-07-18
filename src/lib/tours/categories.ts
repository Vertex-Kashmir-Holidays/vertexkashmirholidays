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
      "Discover family-friendly Kashmir tour packages with comfortable hotels, private cabs, sightseeing, and flexible itineraries for all ages.",
  },
  ADVENTURE: {
    slug: "adventure-tour-packages",
    shortLabel: "Adventure",
    pageTitle: "Adventure Tour Packages",
    emoji: "🏔",
    cardDescription:
      "For trekking, skiing and outdoor enthusiasts chasing Kashmir's mountain trails.",
    metaDescription:
      "Thrilling Kashmir adventure tour packages featuring trekking, skiing, river rafting, and guided mountain expeditions for outdoor enthusiasts.",
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
      "Affordable shared departures with fixed itineraries, great for friends and colleagues.",
    metaDescription:
      "Affordable Kashmir group tour packages with fixed departures, guided sightseeing, quality hotels, and seamless travel planning.",
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
