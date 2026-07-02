'use client';

import { motion } from 'framer-motion';
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
          <motion.h1
            className="h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {renderAccents(heading.title)}
          </motion.h1>
          {heading.subtitle && (
            <motion.p
              className="mt-3 text-[15px] text-white/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {heading.subtitle}
            </motion.p>
          )}
        </div>

        {/* Stats */}
        <HeroStats stats={stats} />
    </SecondaryHero>
  );
}
