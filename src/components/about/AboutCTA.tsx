// src/components/about/AboutCTA.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/brand';
import { renderMint } from '@/lib/accents';
import type { AboutCtaData } from '@/types/about';

interface AboutCTAProps {
  data: AboutCtaData;
}

export function AboutCTA({ data }: AboutCTAProps) {
  return (
    <section className="mx-auto max-w-[1300px] px-4 py-14 sm:px-6">
      {/* Single cohesive panel: warm-frost glass in light, navy frost in dark.
          No background image — the prior decorative <img>/left gradient left a
          grey broken-image block when the asset failed to load. */}
      <motion.div
        className="glass-cream relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center shadow-card sm:px-10 sm:py-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Subtle centered glow for depth — decorative only. */}
        <div
          aria-hidden
          className="orb orb-gold absolute left-1/2 top-1/2 -z-10 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2"
        />
        <h2 className="h-display font-display text-[18px] font-bold leading-snug text-foreground">
          {renderMint(data.title)}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[16px] text-muted-foreground">{data.subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          {data.whatsappLabel && (
            <Link
              href={data.whatsappHref ?? '#'}
              className="inline-flex items-center gap-2.5 rounded-lg bg-brand-bright px-6 py-3.5 text-[14px] font-bold text-white shadow-card transition hover:brightness-110"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
              {data.whatsappLabel}
            </Link>
          )}
          {data.callLabel && (
            <Link
              href={data.callHref ?? '#'}
              className="inline-flex items-center gap-2.5 rounded-lg border border-border px-6 py-3.5 text-[14px] font-semibold text-foreground transition hover:bg-foreground hover:text-background"
            >
              <Phone className="h-4 w-4" strokeWidth={2} />
              {data.callLabel}
            </Link>
          )}
          {data.emailLabel && (
            <Link
              href={data.emailHref ?? '#'}
              className="inline-flex items-center gap-2.5 rounded-lg border border-border px-6 py-3.5 text-[14px] font-semibold text-foreground transition hover:bg-foreground hover:text-background"
            >
              <Mail className="h-4 w-4" strokeWidth={2} />
              {data.emailLabel}
            </Link>
          )}
        </div>
      </motion.div>
    </section>
  );
}
