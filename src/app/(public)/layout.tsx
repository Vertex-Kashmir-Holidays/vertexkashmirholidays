'use client';

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { PageTransition } from "@/components/layout/PageTransition";
import { usePathname } from "next/navigation";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isToursPage = pathname === '/tours';

  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main className={`min-h-screen ${isToursPage ? 'bg-light-bg' : 'bg-dark-bg'}`}>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </>
  );
}