// src/components/faq/FaqHero.tsx
'use client';

import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';

export function FaqHero() {
  return (
    <SecondaryHero
      image="/hero/lidder-reiver-lg.webp"
      imageMobile="/hero/lidder-river.webp"
      alt="Kashmir valley"
      aside={<HeroLeadCard source="faq" />}
    >
      <nav className="flex items-center gap-2 text-[14px] text-white/85" aria-label="Breadcrumb">
        <a href="/" className="transition hover:text-white">Home</a>
        <span>›</span>
        <span className="font-semibold text-white">FAQ</span>
      </nav>
      <h1
        className="hero-reveal h-display mt-6 font-display text-3xl font-bold leading-[1.12] text-white sm:text-4xl lg:text-[48px]"
        style={{ '--hr-y': '30px', '--hr-delay': '0.1s' } as React.CSSProperties}
      >
        Frequently Asked Questions
      </h1>
      <p
        className="hero-reveal mt-5 max-w-md text-[16px] leading-relaxed text-white/85"
        style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
      >
        Everything you need to know before booking your Kashmir trip — payments, itineraries, weather and more.
      </p>
    </SecondaryHero>
  );
}
