import { unstable_cache } from "next/cache";
import type { SiteSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FooterSettings } from "@/components/layout/Footer";

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

// Single source of truth for the field set the sitewide Footer needs. Both the
// global public layout and the standalone adventure microsite pages feed this,
// so they can't drift and silently drop compliance fields (Reg./GSTIN) on one
// route.
export function buildFooterSettings(s: SiteSettings | null): FooterSettings | null {
  return s
    ? {
        siteName: s.siteName,
        siteTagline: s.siteTagline,
        siteEmail: s.siteEmail,
        sitePhone: s.sitePhone,
        siteAddress: s.siteAddress,
        whatsapp: s.whatsapp,
        facebook: s.facebook,
        instagram: s.instagram,
        twitter: s.twitter,
        youtube: s.youtube,
        googleReviews: s.googleReviews,
        tripadvisor: s.tripadvisor,
        legalName: s.legalName,
        tourismRegNumber: s.tourismRegNumber,
        gstNumber: s.gstNumber,
        addressLine1: s.addressLine1,
        addressCity: s.addressCity,
        addressState: s.addressState,
        addressPincode: s.addressPincode,
        addressCountry: s.addressCountry,
      }
    : null;
}
