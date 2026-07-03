import { prisma } from "@/lib/prisma";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { AnnouncementModal } from "@/components/common/AnnouncementModal";
import { getActiveStrip, getActivePromoBanners, parseBannerPages } from "@/lib/banners";
import type { SlotBanner } from "@/components/public/PromoBannerSlot";
import type { FooterSettings } from "@/components/layout/Footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [s, strip, promos] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    getActiveStrip(),
    getActivePromoBanners(),
  ]);

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
      }
    : null;

  return (
    <SiteSettingsProvider
      value={{
        siteName: s?.siteName ?? "Vertex Kashmir Holidays",
        whatsapp: s?.whatsapp ?? null,
        sitePhone: s?.sitePhone ?? null,
        showAnnouncementBanner: s?.showAnnouncementBanner ?? false,
        announcementMessage: s?.announcementMessage ?? null,
      }}
    >
      <PublicChrome
        settings={settings}
        promoBanners={promoBanners}
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
  );
}
