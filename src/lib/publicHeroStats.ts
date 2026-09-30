import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { SiteStatData } from "@/types/home";

// Hero stat strip shared by /tours, /plan-your-kashmir-trip and every
// /tours/category/[slug] page — same 4 slots (Travellers, Curated Trips,
// Years, Rating), same order, one shared computation so no page can ever
// show a different number for the same claim.
//
// Rating and Curated Trips are genuinely live — computed from real data
// (the approved Review average; the real published Kashmir Tour count) —
// not admin-typed numbers. Travellers and Years stay admin-set, read from
// the existing SiteStat "hero" rows exactly as before (Admin → Home Page):
// there is no honest live source for either in this system — Booking/Lead
// records only go back to when this CRM was built, not the business's full
// pre-CRM history, and no founding year is stored anywhere to compute
// "Years" from. Decided explicitly rather than faking a small/misleading
// "dynamic" number (2026-09-23).
export const getPublicHeroStats = unstable_cache(
  async (): Promise<SiteStatData[]> => {
    const [adminStats, ratingAgg, tourCount] = await Promise.all([
      prisma.siteStat.findMany({ where: { section: "hero" }, orderBy: { sortOrder: "asc" } }),
      prisma.review.aggregate({ where: { approved: true }, _avg: { rating: true }, _count: true }),
      prisma.tour.count({ where: { published: true, region: "KASHMIR" } }),
    ]);

    const travellers = adminStats.find((s) => s.label === "Travellers");
    const years = adminStats.find((s) => s.label === "Years");

    const stats: SiteStatData[] = [];
    if (travellers) {
      stats.push({ label: travellers.label, value: travellers.value, suffix: travellers.suffix });
    }
    // No "+" suffix — this is an exact live count, not an approximate
    // historical figure, so "20+" (implying "more than 20") would be wrong.
    stats.push({ label: "Curated Trips", value: String(tourCount), suffix: null });
    if (years) {
      stats.push({ label: years.label, value: years.value, suffix: years.suffix });
    }
    if (ratingAgg._count > 0 && ratingAgg._avg.rating != null) {
      stats.push({ label: "Rating", value: `${ratingAgg._avg.rating.toFixed(1)}★`, suffix: null });
    }

    return stats;
  },
  ["public-hero-stats"],
  // 30-minute TTL, same rationale/window as the other slow-moving content
  // caches (getHomeContent, getVerifiedPropertiesCount) — a new review or a
  // newly published tour doesn't need to appear within seconds, and this is
  // read on two public pages. Busted via the existing admin "flush cache"
  // action, not a bespoke revalidateTag wired into every Review/Tour
  // mutation route (same convention those other caches already use).
  { revalidate: 1800, tags: ["public-hero-stats"] },
);
