import { formatINR } from "@/lib/accents";
import { KASHMIR_SITE_REGIONS } from "@/lib/tours/regions";
import { publishedPackageOptions } from "@/lib/tours/content";
import type { TourPackageOption } from "@/types/tours";

// Shared bits of the <TourCard /> `tour` prop that differ for package-option
// tours and non-Kashmir regions — used by every listing that can contain them
// (/tours, Tour Collection pages) so the label logic lives in one place.

/** Price fields for a TourCard. A package-option card shows that option's
 *  public 2-person price ("₹16,000 / 2 persons"), never the derived
 *  per-person priceFrom; every other tour is unchanged. */
export function tourCardPricing(t: {
  priceFrom: number;
  priceWas: number | null;
  minPersons?: number;
  /** A single package option's exact 2-person price (package cards). */
  priceForTwo?: number | null;
}) {
  if (t.priceForTwo) {
    return { p: formatINR(t.priceForTwo), priceSuffix: "/ 2 persons" };
  }
  return {
    p: formatINR(t.priceFrom),
    old: t.priceWas ? formatINR(t.priceWas) : undefined,
    minPersons: t.minPersons,
  };
}

/** TourCard inclusion icons — undefined keeps the card's Kashmir default
 *  (incl. Shikara); other regions drop the Shikara icon and the "3★" claim. */
export function tourCardInclusions(region: string) {
  return (KASHMIR_SITE_REGIONS as string[]).includes(region)
    ? undefined
    : { transfers: true, hotel: "Hotel", meals: true, shikara: false };
}

/**
 * Listing cards for a tour: one per published package option (so a tour sold
 * as Basic / Comfort / Premium / Luxury shows as four cards), or a single
 * `null` entry for an ordinary tour. Every card still links to the tour's one
 * canonical /tours/[slug] page — package cards just deep-link to their option.
 */
export function tourCardOptions(packageOptionsRaw: string): (TourPackageOption | null)[] {
  const options = publishedPackageOptions(packageOptionsRaw);
  return options.length ? options : [null];
}

// "No meals included" / "No meals" → the card hides its Meals icon.
const NO_MEALS = /^\s*no\b/i;

/** Card fields that differ for one package option of a tour. */
export function packageOptionCard(
  tour: { title: string; slug: string; coverImage: string | null; region: string },
  option: TourPackageOption,
) {
  const base = tourCardInclusions(tour.region) ?? {
    transfers: true,
    hotel: "3★",
    meals: true,
    shikara: true,
  };
  return {
    key: `${tour.slug}#${option.id}`,
    title: `${tour.title} — ${option.name}`,
    badge: option.name,
    image: option.image || tour.coverImage,
    places: `${option.hotel} · ${option.meals}`,
    detailHref: `/tours/${tour.slug}?package=${encodeURIComponent(option.id)}`,
    // Per-person, the same basis as every other tour in price filters/sorts.
    priceFrom: option.priceForTwo / 2,
    priceForTwo: option.priceForTwo,
    inclusions: { ...base, meals: !NO_MEALS.test(option.meals) },
  };
}
