import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PRODUCTION_HOST = new URL(SITE_URL).hostname;

// Defense in depth alongside the X-Robots-Tag header set in src/proxy.ts:
// any host that isn't the production domain (Vercel's default *.vercel.app
// alias, branch previews, etc.) gets a fully disallowed robots.txt so
// crawlers don't spend budget on duplicate content in the first place.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");

  if (host !== PRODUCTION_HOST) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/booking/success",
          "/booking/failed",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}