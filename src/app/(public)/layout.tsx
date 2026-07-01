import { prisma } from "@/lib/prisma";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { AnnouncementModal } from "@/components/common/AnnouncementModal";
import type { FooterSettings } from "@/components/layout/Footer";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });

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
      <PublicChrome settings={settings}>{children}</PublicChrome>
      <AnnouncementModal />
    </SiteSettingsProvider>
  );
}
