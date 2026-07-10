'use client';

import Link from 'next/link';
import { renderAccents } from '@/lib/accents';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import { HeroStats } from '@/components/layout/HeroStats';
import type { SectionHeading, SiteStatData } from '@/types/home';

interface ToursHeroSectionProps {
  heading: SectionHeading;
  stats: SiteStatData[];
  heroImage?: string | null;
  heroImageMobile?: string | null;
}

export function ToursHeroSection({ heading, stats, heroImage, heroImageMobile }: ToursHeroSectionProps) {
  return (
    <SecondaryHero
      image={heroImage ?? "/hero/gulmarg-lg.webp"}
      imageMobile={heroImageMobile ?? "/hero/gulmarg.webp"}
      alt="Kashmir valley"
      aside={<HeroLeadCard source="tours" buttonLabel="Get Tour Quotes" />}
    >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/tours" className="transition hover:text-white">Tours</Link>
        </nav>

        {/* Title Block */}
        <div className="mt-6">
          <h1
            className="hero-reveal h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
            style={{ '--hr-y': '20px', '--hr-delay': '0.1s' } as React.CSSProperties}
          >
            {renderAccents(heading.title)}
          </h1>
          {heading.subtitle && (
            <p
              className="hero-reveal mt-3 text-[15px] text-white/85"
              style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
            >
              {heading.subtitle}
            </p>
          )}
        </div>

        {/* Stats */}
        <HeroStats stats={stats} />
    </SecondaryHero>
  );
}
