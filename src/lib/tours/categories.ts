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
}

export const TOUR_CATEGORY_META: Record<TourCategory, TourCategoryMeta> = {
  HONEYMOON: { slug: "honeymoon-packages", shortLabel: "Honeymoon", pageTitle: "Honeymoon Packages" },
  FAMILY: { slug: "family-tour-packages", shortLabel: "Family", pageTitle: "Family Tour Packages" },
  ADVENTURE: { slug: "adventure-tour-packages", shortLabel: "Adventure", pageTitle: "Adventure Tour Packages" },
  LUXURY: { slug: "luxury-tour-packages", shortLabel: "Luxury", pageTitle: "Luxury Tour Packages" },
  BUDGET: { slug: "budget-tour-packages", shortLabel: "Budget", pageTitle: "Budget Tour Packages" },
  GROUP: { slug: "group-tour-packages", shortLabel: "Group", pageTitle: "Group Tour Packages" },
  PILGRIMAGE: { slug: "pilgrimage-tour-packages", shortLabel: "Pilgrimage", pageTitle: "Pilgrimage Tour Packages" },
  PREMIUM: { slug: "premium-tour-packages", shortLabel: "Premium", pageTitle: "Premium Tour Packages" },
};

export function getCategoryBySlug(slug: string): TourCategory | null {
  const match = (Object.entries(TOUR_CATEGORY_META) as [TourCategory, TourCategoryMeta][]).find(
    ([, meta]) => meta.slug === slug,
  );
  return match ? match[0] : null;
}
