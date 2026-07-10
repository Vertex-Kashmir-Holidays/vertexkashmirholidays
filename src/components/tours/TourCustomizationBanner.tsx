'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useWhatsAppLink } from '@/components/providers/SiteSettingsProvider';
import { trackWhatsappClick } from '@/lib/analytics';

const EASE = [0.22, 1, 0.36, 1] as const;

interface TourCustomizationBannerProps {
  tourName: string;
}

// Business-critical disclaimer: every tour's itinerary and price are a
// generic starting point (built for a typical traveller) — the actual plan
// and price are customized per customer. Visually matches the footer's
// "Ready to step through the portal?" CTA (sweep + glass-strong + gold orb +
// gradient-text + pill button) so it reads as the same design language.
export function TourCustomizationBanner({ tourName }: TourCustomizationBannerProps) {
  const reduceMotion = useReducedMotion();
  const wa = useWhatsAppLink();
  const customizeHref = wa(
    `Hi! I'm interested in the "${tourName}" tour. I'd like to customize the itinerary and get an updated price — can you help?`,
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mb-6"
    >
      <div className="sweep glass-strong relative overflow-hidden rounded-[2rem] px-5 py-4 text-center shadow-glass sm:px-8 sm:py-5">
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div aria-hidden className="orb orb-gold absolute -right-14 -bottom-14 h-52 w-52" />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.4} />
            Starting Itinerary &amp; Price
          </span>
          <h2 className="h-display text-lg font-bold text-foreground sm:text-xl">
            Every trip is <span className="grad-text-cool italic">tailored just for you</span>
          </h2>
          <p className="max-w-2xl text-[13px] leading-snug text-muted-foreground sm:text-sm">
            The itinerary and price above are a starting point, built for a typical traveller — hotels,
            pace, activities and duration can all be adjusted to your needs.
          </p>
          <a
            href={customizeHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsappClick('tour_customize_banner')}
            className="ring-inner mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[13px] font-bold text-primary-foreground shadow-glow transition hover:scale-[1.03]"
          >
            Customize This Trip
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
