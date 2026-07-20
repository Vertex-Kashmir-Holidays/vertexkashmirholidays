import { Toaster } from "sonner";
import { prisma } from "@/lib/prisma";
import { getSiteSettings, buildFooterSettings } from "@/lib/siteSettings";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteAnalytics } from "@/components/providers/SiteAnalytics";
import { AnnouncementModal } from "@/components/common/AnnouncementModal";
import { getActiveStrip, getActivePromoBanners, parseBannerPages } from "@/lib/banners";
import { JsonLd, buildTravelAgency } from "@/components/seo/JsonLd";
import type { SlotBanner } from "@/components/public/PromoBannerSlot";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [s, strip, promos, categoryRows, homeContent] = await Promise.all([
    getSiteSettings(),
    getActiveStrip(),
    getActivePromoBanners(),
    prisma.tour.groupBy({ by: ["category"], where: { published: true }, _count: true }),
    prisma.homeContent.findUnique({ where: { id: "singleton" }, select: { formAvatars: true } }),
  ]);
  const tourCategories = categoryRows.filter((c) => c._count > 0).map((c) => c.category);

  // Reused sitewide as social-proof avatars next to every lead form (see
  // SiteSettingsProvider) — same real customer photos already live on the
  // homepage hero, not a separate asset set.
  let formAvatars: string[] = [];
  try {
    formAvatars = JSON.parse(homeContent?.formAvatars ?? "[]");
  } catch {
    formAvatars = [];
  }

  // Parse each banner's target pages once on the server; the client slot filters
  // by the current pathname (so "*"/All Pages shows everywhere).
  const promoBanners: SlotBanner[] = promos.map((b) => ({
    id: b.id,
    title: b.title,
    body: b.body,
    ctaLabel: b.ctaLabel,
    ctaUrl: b.ctaUrl,
    imageUrl: b.imageUrl,
    imageMobileUrl: b.imageMobileUrl,
    pages: parseBannerPages(b.pages),
  }));

  const settings = buildFooterSettings(s);

  // Sitewide Organization JSON-LD — injected once here (not per-page) so every
  // public page's own JSON-LD graph can resolve the "@id" references used by
  // Product/TouristTrip/BlogPosting/TouristDestination (seller/provider/
  // organizer) on that same page.
  //
  // WebSite JSON-LD is deliberately NOT injected here — Google's structured
  // data guidelines require it to appear only on the homepage (the signal
  // used for "preferred site name" in Search); it's rendered in
  // (public)/page.tsx instead. Putting it on every page (as before) worked
  // against spec even though it never produced conflicting values.
  const sameAs = [
    s?.facebook,
    s?.instagram,
    s?.twitter,
    s?.youtube,
    s?.tripadvisor,
    s?.googleReviews,
    s?.googleBusinessProfile,
  ].filter((u): u is string => Boolean(u && u.startsWith("http")));

  const organizationJsonLd = buildTravelAgency({
    telephone: s?.sitePhone,
    email: s?.siteEmail,
    legalName: s?.legalName,
    taxId: s?.gstNumber,
    streetAddress: s?.addressLine1,
    addressLocality: s?.addressCity,
    addressRegion: s?.addressState,
    postalCode: s?.addressPincode,
    addressCountry: s?.addressCountry === "India" ? "IN" : s?.addressCountry,
    sameAs,
  });

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SiteAnalytics />
      <SiteSettingsProvider
        value={{
          siteName: s?.siteName ?? "Vertex Kashmir Holidays",
          whatsapp: s?.whatsapp ?? null,
          sitePhone: s?.sitePhone ?? null,
          showAnnouncementBanner: s?.showAnnouncementBanner ?? false,
          announcementMessage: s?.announcementMessage ?? null,
          formAvatars,
        }}
      >
        <JsonLd data={organizationJsonLd} />
        <PublicChrome
          settings={settings}
          promoBanners={promoBanners}
          tourCategories={tourCategories}
          strip={
            strip
              ? {
                  id: strip.id,
                  title: strip.title,
                  body: strip.body,
                  ctaLabel: strip.ctaLabel,
                  ctaUrl: strip.ctaUrl,
                }
              : null
          }
        >
          {children}
        </PublicChrome>
        <AnnouncementModal />
      </SiteSettingsProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
