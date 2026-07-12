import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// SiteSettings is the single most-read row in the database — nearly every
// public page (plus several admin pages) independently queries it. Wrapped
// in unstable_cache so it's shared across requests (not just within one),
// with a short TTL as a safety net and revalidateTag("site-settings") in the
// settings save route (+ the existing flushPublicCache admin action) for
// immediate invalidation on edit.
export const getSiteSettings = unstable_cache(
  async () => prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ["site-settings"],
  { revalidate: 60, tags: ["site-settings"] },
);
