import { formatINR } from "@/lib/accents";
import { KASHMIR_SITE_REGIONS } from "@/lib/tours/regions";
import { publishedPackageOptions } from "@/lib/tours/content";
import type { TourPackageOption } from "@/types/tours";

// Shared bits of the <TourCard /> `tour` prop that differ for package-option
// tours and non-Kashmir regions — used by every listing that can contain them
// (/tours, Tour Collection pages) so the label logic lives in one place.

/** Card label shown in the price spot of a price-on-request tour. */
export const REQUEST_QUOTE_LABEL = "Request Quote";

/** Price fields for a TourCard. A package-option card shows that option's
 *  public 2-person price ("₹16,000 / 2 persons"), never the derived
 *  per-person priceFrom; a Tour.hidePrice tour shows "Request Quote" and no
 *  price at all; every other tour is unchanged. Every card builder should go
 *  through this so the hidePrice rule can't be missed in one listing. */
export function tourCardPricing(t: {
  priceFrom: number;
  priceWas: number | null;
  minPersons?: number;
  /** A single package option's exact 2-person price (package cards). */
  priceForTwo?: number | null;
  /** Required on purpose: a query that forgets to select it fails to compile
   *  instead of quietly showing a hidden price. */
  hidePrice: boolean;
}) {
  if (t.hidePrice) {
    return { p: REQUEST_QUOTE_LABEL, priceHidden: true as const };
  }
  if (t.priceForTwo) {
    return { p: formatINR(t.priceForTwo), priceSuffix: "/ 2 persons" };
  }
  return {
    p: formatINR(t.priceFrom),
    old: t.priceWas ? formatINR(t.priceWas) : undefined,
    minPersons: t.minPersons,
  };
}

/** Price fields safe to send to the browser (client listings filter/sort on
 *  them): a hidePrice tour's real price is replaced with 0 so it never
 *  appears in page data — listings key off `hidePrice`, not the 0. */
export function publicPriceFields(t: {
  priceFrom: number;
  priceWas: number | null;
  hidePrice: boolean;
}) {
  return t.hidePrice
    ? { priceFrom: 0, priceWas: null, hidePrice: true }
    : { priceFrom: t.priceFrom, priceWas: t.priceWas, hidePrice: false };
}

/** A price-on-request tour is enquiry-only, whatever its stored formMode
 *  (the admin save forces INQUIRY_ONLY too; this covers older rows). */
export function effectiveFormMode<M extends string>(t: {
  formMode: M;
  hidePrice: boolean;
}): M | "INQUIRY_ONLY" {
  return t.hidePrice ? "INQUIRY_ONLY" : t.formMode;
}

/** Detail-page price lines for a price-on-request tour. */
export const PRICE_ON_REQUEST_TITLE = "Price on request";
export const PRICE_ON_REQUEST_BODY =
  "Quoted for your dates and group size. Tell us both and we'll send a written quote with everything included.";

/** Price-sort comparator: price-on-request tours always go last. */
export function comparePrice<T extends { priceFrom: number; hidePrice?: boolean }>(
  dir: "asc" | "desc",
) {
  return (a: T, b: T) => {
    if (!!a.hidePrice !== !!b.hidePrice) return a.hidePrice ? 1 : -1;
    return dir === "asc" ? a.priceFrom - b.priceFrom : b.priceFrom - a.priceFrom;
  };
}

/** TourCard inclusion icons — undefined keeps the card's Kashmir default
 *  (incl. Shikara, hotel label from the tour's category); other regions drop the
 *  Shikara icon and show a plain "Hotel". */
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

// "No meals included" / "No meals" → the card hides its Meals icon .
const NO_MEALS = /^\s*no\b/i;

/** Card fields that differ for one package option of a tour. */
export function packageOptionCard(
  tour: { title: string; slug: string; coverImage: string | null; region: string },
  option: TourPackageOption,
) {
  const base = tourCardInclusions(tour.region) ?? {
    transfers: true,
    hotel: "Hotel",
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
