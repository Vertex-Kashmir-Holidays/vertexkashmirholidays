'use client';

import { usePathname } from 'next/navigation';
import { Footer, type FooterSettings } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { PageTransition } from '@/components/layout/PageTransition';

interface PublicChromeProps {
  children: React.ReactNode;
  settings: FooterSettings | null;
}

export function PublicChrome({ children, settings }: PublicChromeProps) {
  const pathname = usePathname();

  // Campaign *detail* pages (/campaign/[slug]) are full-page microsites that
  // bring their own nav/footer — render them standalone without the global
  // navbar, footer or aurora background. The /campaign listing page is a normal
  // public page and keeps the global chrome (like /tours).
  const isStandalone = /^\/campaign\/[^/]+/.test(pathname ?? '');

  if (isStandalone) {
    return <>{children}</>;
  }

  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main className="min-h-screen bg-background text-foreground">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer settings={settings} />
    </>
  );
}
