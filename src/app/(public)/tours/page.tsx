// src/app/(public)/tours/page.tsx
'use client';

import { ToursFiltersSidebar } from '@/components/tours/ToursFiltersSidebar';
import { ToursGridSection } from '@/components/tours/ToursGridSection';
import { ToursHeroSection } from '@/components/tours/ToursHeroSection';
import { ToursNewsletter } from '@/components/tours/ToursNewsletter';
import { ToursTrustBar } from '@/components/tours/ToursTrustBar';
import { useState } from 'react';

export default function ToursPage() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div className="bg-light-bg text-light-text">
      <ToursHeroSection />
      <main className="mx-auto max-w-[1300px] px-6 py-10">
        <div className="grid gap-7 lg:grid-cols-[252px_1fr]">
          <ToursFiltersSidebar 
            isMobileOpen={showMobileFilters} 
            onClose={() => setShowMobileFilters(false)} 
          />
          <ToursGridSection onFilterToggle={() => setShowMobileFilters(true)} />
        </div>
      </main>
      <ToursTrustBar />
      <ToursNewsletter />
    </div>
  );
}