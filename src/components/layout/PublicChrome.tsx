"use client";

import { usePathname } from "next/navigation";
import type { TourCategory } from "@prisma/client";
import { Footer, type FooterSettings } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { PageTransition } from "@/components/layout/PageTransition";
import { BannerStrip, type StripBannerData } from "@/components/public/BannerStrip";
import { PromoBannerSlot, type SlotBanner } from "@/components/public/PromoBannerSlot";
import { OfflineBanner } from "@/components/layout/OfflineBanner";

interface PublicChromeProps {
  children: React.ReactNode;
  settings: FooterSettings | null;
  strip: StripBannerData | null;
  promoBanners: SlotBanner[];
  tourCategories: TourCategory[];
}

export function PublicChrome({
  children,
  settings,
  strip,
  promoBanners,
  tourCategories,
}: PublicChromeProps) {
  const pathname = usePathname();

  // Adventure *detail* pages (/adventures/[slug]) are full-page microsites that
  // bring their own nav/footer — render them standalone without the global
  // navbar, footer or aurora background. The /adventures listing page is a normal
  // public page and keeps the global chrome (like /tours).
  const isStandalone = /^\/adventures\/[^/]+/.test(pathname ?? "");

  if (isStandalone) {
    return (
      <>
        <OfflineBanner />
        {children}
      </>
    );
  }

  return (
    <>
      <OfflineBanner />
      {strip && <BannerStrip banner={strip} />}
      <AuroraBackground />
      <Navbar />
      <main className="min-h-screen bg-background text-foreground">
        <PageTransition>{children}</PageTransition>
      </main>
      {/* PROMO banners for the current page (path-filtered). Placed just above
          the footer so it's consistent site-wide and never fights a page hero. */}
      <PromoBannerSlot banners={promoBanners} />
      <Footer settings={settings} tourCategories={tourCategories} />
    </>
  );
}
