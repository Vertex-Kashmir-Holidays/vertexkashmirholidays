// src/components/contact/ContactHero.tsx
'use client';

import { motion } from 'framer-motion';
import type { ContactHeroData, ContactHeroFeatureData } from '@/types/contact';

interface ContactHeroProps {
  data: ContactHeroData;
  features: ContactHeroFeatureData[];
}

export function ContactHero({ data, features }: ContactHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      {data.image && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <picture className="block h-full w-full">
            {data.imageMobile && (
              <source media="(max-width: 640px)" srcSet={data.imageMobile} />
            )}
            <img
              src={data.image}
              alt="Houseboats on Dal Lake at dusk"
              className="h-full w-full object-cover"
            />
          </picture>
        </motion.div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/40 to-transparent"></div>

      <div className="relative mx-auto max-w-[1300px] px-5 pb-16 pt-28 sm:px-6 sm:pt-32 lg:py-24">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          <a href="/" className="transition hover:text-white">Home</a>
          <span>›</span>
          <span className="font-semibold text-white">{data.breadcrumb}</span>
        </nav>
        <motion.h1
          className="h-display mt-6 font-display text-[42px] font-bold leading-[1.12] text-white lg:text-[48px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {data.title}
        </motion.h1>
        {data.subtitle && (
          <motion.p
            className="mt-5 max-w-md text-[14.5px] leading-relaxed text-white/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {data.subtitle}
          </motion.p>
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
      </div>
    </section>
  );
}
