// src/components/about/AboutHero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { renderMint } from '@/lib/accents';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import type { AboutHeroData } from '@/types/about';

interface AboutHeroProps {
  data: AboutHeroData;
}

export function AboutHero({ data }: AboutHeroProps) {
  return (
    <SecondaryHero image={data.image} imageMobile={data.imageMobile} alt="Traveller overlooking a Kashmir valley">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          <a href="/" className="transition hover:text-white">Home</a>
          <span>›</span>
          <span className="font-semibold text-white">{data.breadcrumb}</span>
        </nav>
        <motion.h1
          className="h-display mt-4 font-display text-[44px] font-bold leading-[1.12] text-white lg:text-[52px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {renderMint(data.title)}
        </motion.h1>
        <motion.p
          className="mt-6 max-w-md text-[14.5px] leading-relaxed text-white/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {data.subtitle}
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3.5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {data.ctaPrimaryLabel && (
            <Link
              href={data.ctaPrimaryHref ?? '#'}
              className="inline-flex items-center gap-2.5 rounded-full bg-brand-bright px-6 py-3 text-[13.5px] font-bold text-white shadow-card transition hover:brightness-110"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20">
                <Play className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              </span>
              {data.ctaPrimaryLabel}
            </Link>
          )}
          {data.ctaSecondaryLabel && (
            <Link
              href={data.ctaSecondaryHref ?? '#'}
              className="rounded-full border border-white/55 px-6 py-3 text-[13.5px] font-semibold text-white backdrop-blur transition hover:bg-white hover:text-brand-ink"
            >
              {data.ctaSecondaryLabel}
            </Link>
          )}
        </motion.div>
    </SecondaryHero>
  );
}
