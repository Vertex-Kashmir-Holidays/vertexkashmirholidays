import type { TourRegion } from "@prisma/client";

// Regions shown on the site's Kashmir-branded surfaces (homepage, /tours/
// category/*, origin-city pages, category spotlight). Everything outside this
// list (e.g. HIMACHAL) only appears on /tours (All Tours), its Tour Collection
// pages, and its own /tours/[slug] page. Use as `region: { in: KASHMIR_SITE_REGIONS }`.
export const KASHMIR_SITE_REGIONS: TourRegion[] = ["KASHMIR", "LADAKH"];

export const TOUR_REGION_LABEL: Record<TourRegion, string> = {
  KASHMIR: "Kashmir",
  LADAKH: "Ladakh",
  HIMACHAL: "Himachal",
};
