import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Admin-editable copy for /plan-your-kashmir-trip — same singleton pattern
// and caching rationale as getHomeContent() (src/lib/homeContent.ts). Edited
// via the generic ContentForm + PATCH /api/pages/content/tripPlanner
// (src/app/admin/trip-planner/page.tsx), busted via the existing admin
// "flush cache" action rather than a bespoke revalidateTag call, same as
// HomeContent.
export const getTripPlannerContent = unstable_cache(
  () => prisma.tripPlannerContent.findUnique({ where: { id: "singleton" } }),
  ["trip-planner-content-singleton"],
  { revalidate: 1800, tags: ["trip-planner-content"] },
);
