// src/components/destinations/DestinationsHero.tsx
'use client';

import { motion } from 'framer-motion';
import { Sparkles, Compass, BadgeIndianRupee, type LucideIcon } from 'lucide-react';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';

const badges: { t: string; s: string; Icon: LucideIcon }[] = [
  { t: 'Handpicked', s: 'by local experts', Icon: Sparkles },
  { t: 'Real Experiences', s: 'not tourist traps', Icon: Compass },
  { t: 'Best Price', s: 'guaranteed', Icon: BadgeIndianRupee },
];

interface DestinationsHeroProps {
  heroImage?: string | null;
  heroImageMobile?: string | null;
}

export function DestinationsHero({ heroImage, heroImageMobile }: DestinationsHeroProps) {
  return (
    <SecondaryHero
      image={heroImage ?? '/hero/srinagar-lg.webp'}
      imageMobile={heroImageMobile ?? '/hero/srinagar.webp'}
      alt="Dal Lake, Kashmir"
      aside={<HeroLeadCard source="destinations" />}
    >
      <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
        <a href="/" className="transition hover:text-white">Home</a>
        <span>›</span>
        <span className="font-semibold text-white">Destinations</span>
      </nav>

      <h1
        className="hero-reveal mt-7 max-w-xl text-4xl font-bold leading-[1.15] text-white lg:text-[42px]"
        style={{ '--hr-y': '20px' } as React.CSSProperties}
      >
        Explore the breathtaking destinations of Kashmir
      </h1>
      <p
        className="hero-reveal mt-5 max-w-md text-[15px] leading-relaxed text-white/85"
        style={{ '--hr-delay': '0.1s' } as React.CSSProperties}
      >
        From snow-capped peaks to serene valleys and crystal clear lakes – discover paradise on earth.
      </p>

      <motion.div
        className="mt-8 flex flex-wrap gap-3.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {badges.map(({ t, s, Icon }) => (
          <div
            key={t}
            className="flex items-center gap-3 rounded-xl border border-white/25 bg-black/35 px-4 py-2.5 backdrop-blur"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30 text-white">
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="leading-tight">
              <span className="block text-[13px] font-bold text-white">{t}</span>
              <span className="block text-[11px] text-white/70">{s}</span>
            </span>
          </div>
        ))}
      </motion.div>
    </SecondaryHero>
  );
}
