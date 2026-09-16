import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// The HomeContent singleton was previously queried twice per relevant
// request — once in (public)/layout.tsx (formAvatars only, for the sitewide
// lead-form avatar strip) and again, independently, in (public)/page.tsx
// (full row, for hero/about copy). One shared cached read, used by both.
// No mutation route currently calls revalidateTag("home-content") (HomeContent
// edits happen via the generic content-block route, not audited as part of
// this pass), so this relies on its TTL rather than on-demand invalidation —
// moderate 30-minute window, not the 24h used for content types with a wired
// invalidation path.
export const getHomeContent = unstable_cache(
  () => prisma.homeContent.findUnique({ where: { id: "singleton" } }),
  ["home-content-singleton"],
  { revalidate: 1800, tags: ["home-content"] },
);
