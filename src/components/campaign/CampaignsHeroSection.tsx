'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import { HeroStats } from '@/components/layout/HeroStats';
import type { SiteStatData } from '@/types/home';

interface CampaignsHeroSectionProps {
  title: string;
  subtitle: string;
  stats: SiteStatData[];
}

export function CampaignsHeroSection({ title, subtitle, stats }: CampaignsHeroSectionProps) {
  return (
    <SecondaryHero
      image="/hero/pahalgam-lg.webp"
      imageMobile="/hero/pahalgam.webp"
      alt="Kashmir campaign experiences"
      aside={<HeroLeadCard source="campaign" buttonLabel="Get Campaign Offers" />}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-white/80" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-white">Home</Link>
        <span>›</span>
        <span className="text-white/60">Campaigns</span>
      </nav>

      {/* Title Block */}
      <div className="mt-6">
        <motion.h1
          className="h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="mt-3 max-w-xl text-[15px] text-white/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      </div>

      {/* Stats */}
      <HeroStats stats={stats} />
    </SecondaryHero>
  );
}
