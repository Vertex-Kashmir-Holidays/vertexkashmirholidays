// Server-only helpers for the CMS-driven Banner system. STRIP banners render a
// thin bar above the navbar (one at a time); PROMO banners are placed inline in
// page content via getBannersForPage().
import "server-only";
import type { Banner, BannerType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Public page keys a banner may target (plus "*" for all pages). */
export const BANNER_PAGE_KEYS = [
  "home",
  "tours",
  "destinations",
  "blog",
  "about",
  "contact",
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
 * wins; newest breaks ties. Rendered in the public layout above the chrome.
 */
export async function getActiveStrip(): Promise<Banner | null> {
  return prisma.banner.findFirst({
    where: activeWhere("STRIP"),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
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
 */
export async function getActivePromoBanners(): Promise<Banner[]> {
  return prisma.banner.findMany({
    where: activeWhere("PROMO"),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}
