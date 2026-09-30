// Server-only helpers for the CMS-driven Banner system. STRIP banners render a
// thin bar above the navbar (one at a time); PROMO banners are placed inline in
// page content via getBannersForPage().
import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import type { Banner, BannerType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PromoBannerData } from "@/components/public/PromoBanner";
import { parseBannerFeatures } from "@/components/public/bannerIcons";

/** Public page keys a banner may target (plus "*" for all pages). */
export const BANNER_PAGE_KEYS = [
  "home",
  "tours",
  "destinations",
  "blog",
  "about",
  "contact",
  // Three distinct promo slots within /plan-your-kashmir-trip (rendered via
  // the existing PromoBanner/PromoBannerCard, same as the sitewide promo
  // banners elsewhere) — separate page keys, not a "position" field on
  // Banner, so this reuses 100% of the existing admin Banner module/UI with
  // zero schema change. Positioned per transport mode, e.g. train before the
  // packages, flights after the pricing block, bus after "Why Plan With
  // Vertex" — but any PROMO banner can be assigned to any of the three,
  // admin's choice.
  "trip-planner-before-tours",
  "trip-planner-after-pricing",
  "trip-planner-after-why",
  // Two promo slots on every Tour Collection page (/kashmir-tour-packages, …):
  // one inside the tour grid after the 6th card (only when more than 6 tours
  // are showing), one after the full grid. Same page-key approach as above.
  "tour-collection-after-6",
  "tour-collection-after-all",
  // Two promo slots on every Occasion Offer page (/offers/…) — typically
  // transport (getting to Kashmir, local union cabs): one after Plans &
  // Prices, one after the day-by-day itinerary.
  "offer-after-plans",
  "offer-after-itinerary",
] as const;

export type BannerPageKey = (typeof BANNER_PAGE_KEYS)[number];

/**
 * Prisma `where` clause matching banners that are active *right now*: flagged
 * active, and within their optional [startsAt, endsAt] window. Shared by the
 * layout strip query and getBannersForPage().
 */
function activeWhere(type: BannerType) {
  const now = new Date();
  return {
    type,
    isActive: true,
    OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
  };
}

/** Parse the JSON `pages` column into a string[], falling back to ["*"]. */
export function parseBannerPages(raw: string | null | undefined): string[] {
  if (!raw) return ["*"];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : ["*"];
  } catch {
    return ["*"];
  }
}

/**
 * The single highest-priority active STRIP banner, or null. Lower sortOrder
 * wins; newest breaks ties. Rendered in the public layout above the chrome —
 * runs on every public page's render, so it's cached like the layout's other
 * shared reads (getSiteSettings). A short 5-minute TTL, not the longer window
 * most CMS content now uses, because a banner's active window is time-based
 * (startsAt/endsAt), not just edit-based — it needs to actually stop showing
 * near its scheduled end time even without an admin edit.
 */
export const getActiveStrip = unstable_cache(
  (): Promise<Banner | null> =>
    prisma.banner.findFirst({
      where: activeWhere("STRIP"),
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ["active-strip-banner"],
  { revalidate: 300, tags: ["banners"] },
);

/** Narrow a Banner row to the fields PromoBannerCard reads (both layouts). */
export function bannerToPromoData(b: Banner): PromoBannerData {
  return {
    id: b.id,
    title: b.title,
    body: b.body,
    ctaLabel: b.ctaLabel,
    ctaUrl: b.ctaUrl,
    imageUrl: b.imageUrl,
    imageMobileUrl: b.imageMobileUrl,
    layout: b.layout,
    contentBackground: b.contentBackground,
    kicker: b.kicker,
    subtitle: b.subtitle,
    features: parseBannerFeatures(b.features),
  };
}

export function toPromoBannerData(banners: Banner[]): PromoBannerData[] {
  return banners.map(bannerToPromoData);
}

/**
 * Active PROMO banners targeting `pageKey` (or "*"). Page RSCs call this and
 * pass the result to <PromoBanner>. Ordered by sortOrder ascending.
 */
export async function getBannersForPage(pageKey: string): Promise<Banner[]> {
  const banners = await prisma.banner.findMany({
    where: activeWhere("PROMO"),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  // `pages` is a JSON string column, so filter the page-key match in memory.
  return banners.filter((b) => {
    const pages = parseBannerPages(b.pages);
    return pages.includes("*") || pages.includes(pageKey);
  });
}

/**
 * All active PROMO banners (not page-filtered), ordered by sortOrder. Used by
 * the public layout, which passes them to a client slot that filters by the
 * current pathname — so a banner targeting "*" (All Pages) shows everywhere and
 * page-specific banners show only on their pages, without wiring each page RSC.
 * Cached the same way and for the same reason as getActiveStrip above.
 */
export const getActivePromoBanners = unstable_cache(
  (): Promise<Banner[]> =>
    prisma.banner.findMany({
      where: activeWhere("PROMO"),
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ["active-promo-banners"],
  { revalidate: 300, tags: ["banners"] },
);

// SPLIT-layout feature rows (icon + heading + optional line); max 4.
export const bannerFeaturesSchema = z
  .array(
    z.object({
      icon: z.string().trim().min(1).max(30),
      title: z.string().trim().min(1, "Feature heading is required").max(40),
      text: z
        .string()
        .trim()
        .max(80)
        .optional()
        .transform((v) => v || undefined),
    }),
  )
  .max(4, "Up to 4 features");
