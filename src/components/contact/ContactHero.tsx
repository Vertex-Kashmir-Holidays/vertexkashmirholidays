// src/components/contact/ContactHero.tsx
'use client';

import { motion } from 'framer-motion';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import type { ContactHeroData, ContactHeroFeatureData } from '@/types/contact';

interface ContactHeroProps {
  data: ContactHeroData;
  features: ContactHeroFeatureData[];
}

export function ContactHero({ data, features }: ContactHeroProps) {
  return (
    <SecondaryHero
      image={data.image}
      imageMobile={data.imageMobile}
      alt="Houseboats on Dal Lake at dusk"
      aside={<HeroLeadCard source="contact" />}
    >
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          <a href="/" className="transition hover:text-white">Home</a>
          <span>›</span>
          <span className="font-semibold text-white">{data.breadcrumb}</span>
        </nav>
        <h1
          className="hero-reveal h-display mt-6 font-display text-3xl font-bold leading-[1.12] text-white sm:text-4xl lg:text-[48px]"
          style={{ '--hr-y': '30px', '--hr-delay': '0.1s' } as React.CSSProperties}
        >
          {data.title}
        </h1>
        {data.subtitle && (
          <p
            className="hero-reveal mt-5 max-w-md text-[14.5px] leading-relaxed text-white/85"
            style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
          >
            {data.subtitle}
          </p>
        )}
        {features.length > 0 && (
          <motion.div
            className="mt-9 flex flex-wrap gap-x-12 gap-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {features.map((feat) => (
              <div key={feat.id} className="flex items-center gap-3 text-white">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-white/35">
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={feat.icon} />
                  </svg>
                </span>
                <div className="leading-tight">
                  <p className="text-[13.5px] font-bold">{feat.title}</p>
                  <p className="text-[11.5px] text-white/70">{feat.subtitle}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
    </SecondaryHero>
  );
}
