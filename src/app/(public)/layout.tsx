import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/atoms/tooltip";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SiteAnalytics } from "@/components/providers/SiteAnalytics";
import { CookieConsentManager } from "@/components/providers/CookieConsentManager";
import { AnnouncementModal } from "@/components/common/AnnouncementModal";
import { getActiveStrip, getActivePromoBanners, parseBannerPages } from "@/lib/banners";
import { JsonLd, buildTravelAgency } from "@/components/seo/JsonLd";
import { getActiveCorporateOffices } from "@/lib/companyOffice";
import type { SlotBanner } from "@/components/public/PromoBannerSlot";
import type { FooterSettings } from "@/components/layout/Footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [s, strip, promos, categoryRows, homeContent, corporateOffices] = await Promise.all([
    getSiteSettings(),
    getActiveStrip(),
    getActivePromoBanners(),
    prisma.tour.groupBy({ by: ["category"], where: { published: true }, _count: true }),
    prisma.homeContent.findUnique({ where: { id: "singleton" }, select: { formAvatars: true } }),
    getActiveCorporateOffices(),
  ]);
  const tourCategories = categoryRows.filter((c) => c._count > 0).map((c) => c.category);
  // First active row (lowest sortOrder) is "the" Corporate Office shown in
  // the footer — admin-managed via /admin/settings, hidden entirely when
  // none is set (see companyOffice.ts).
  const corporateOffice = corporateOffices[0]
    ? { name: corporateOffices[0].name, address: corporateOffices[0].address }
    : null;

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

  const settings: FooterSettings | null = s
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

  // The TravelAgency/LocalBusiness address is the Corporate Office (the real
  // staffed location an admin has set) when one exists — matching whatever
  // the Google Business Profile listing actually points to — else the
  // Registered Office's full structured address as a fallback.
  const organizationJsonLd = buildTravelAgency({
    telephone: s?.sitePhone,
    email: s?.siteEmail,
    legalName: s?.legalName,
    taxId: s?.gstNumber,
    ...(corporateOffice
      ? { streetAddress: corporateOffice.address, addressCountry: "IN" }
      : {
          streetAddress: s?.addressLine1,
          addressLocality: s?.addressCity,
          addressRegion: s?.addressState,
          postalCode: s?.addressPincode,
          addressCountry: s?.addressCountry === "India" ? "IN" : s?.addressCountry,
        }),
    sameAs,
  });

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <SiteAnalytics />
        <CookieConsentManager />
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
            corporateOffice={corporateOffice}
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
      </TooltipProvider>
    </ThemeProvider>
  );
}
