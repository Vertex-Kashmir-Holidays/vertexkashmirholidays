'use client';

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { PageTransition } from "@/components/layout/PageTransition";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuroraBackground />
      <Navbar />
      <main className="min-h-screen bg-background text-foreground">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </>
  );
}