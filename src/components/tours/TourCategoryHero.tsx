'use client';

import Link from 'next/link';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';

interface TourCategoryHeroProps {
  pageTitle: string;
  subtitle: string;
  heroImage?: string | null;
  heroImageMobile?: string | null;
}

// Same SecondaryHero + breadcrumb + HeroLeadCard shell used by every other
// listing page (Tours, Destinations, Blog, Contact) — kept identical so
// category pages read as a natural part of the site, not a bolted-on template.
export function TourCategoryHero({ pageTitle, subtitle, heroImage, heroImageMobile }: TourCategoryHeroProps) {
  return (
    <SecondaryHero
      image={heroImage ?? '/hero/gulmarg-lg.webp'}
      imageMobile={heroImageMobile ?? '/hero/gulmarg.webp'}
      alt="Kashmir valley"
      aside={<HeroLeadCard source="tour-category" buttonLabel="Get a Free Quote" />}
    >
      <nav className="flex items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-white">Home</Link>
        <span>›</span>
        <Link href="/tours" className="transition hover:text-white">Tours</Link>
        <span>›</span>
        <span className="font-semibold text-white">{pageTitle}</span>
      </nav>

      <div className="mt-6">
        <h1
          className="hero-reveal h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
          style={{ '--hr-y': '20px', '--hr-delay': '0.1s' } as React.CSSProperties}
        >
          {pageTitle}
        </h1>
        <p
          className="hero-reveal mt-3 max-w-md text-[16px] text-white/85"
          style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
        >
          {subtitle}
        </p>
      </div>
    </SecondaryHero>
  );
}
