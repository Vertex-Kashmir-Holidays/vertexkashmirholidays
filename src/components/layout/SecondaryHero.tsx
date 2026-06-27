'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

// ──────────────────────────────────────────────────────────────────────────
// Shared wrapper for every non-home page hero (About, Blog, Contact, Tours,
// Destinations, Legal, …). It owns three things so each page never has to
// re-derive them:
//   1. Equal height       — a fixed `min-h-[360px]` band on every page.
//   2. Nav clearance       — top padding clears the fixed Navbar; content is
//                            vertically centred in the remaining space.
//   3. Background + overlay — responsive <picture> (mobile/desktop) and the
//                            brand gradient scrim.
// Pages pass their own breadcrumb/title/content as children.
// ──────────────────────────────────────────────────────────────────────────

interface SecondaryHeroProps {
  /** Desktop background image URL. */
  image?: string | null;
  /** Optional ≤640px background image URL. */
  imageMobile?: string | null;
  alt?: string;
  children: ReactNode;
  /** Optional right-side content (e.g. a lead-capture card). When present the
   *  hero switches to a two-column layout; content stays left, aside goes right. */
  aside?: ReactNode;
}

export function SecondaryHero({ image, imageMobile, alt = '', children, aside }: SecondaryHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      {image && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <picture className="block h-full w-full">
            {imageMobile && <source media="(max-width: 640px)" srcSet={imageMobile} />}
            <img src={image} alt={alt} className="h-full w-full object-cover object-center" />
          </picture>
        </motion.div>
      )}
      {/* Scrim: vertical on mobile (content + card stack, so darken top→bottom for
          readability), horizontal from lg up (two columns, so darken left→right
          and let the photo breathe behind the card). */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/85 via-brand-dark/55 to-brand-dark/80 lg:bg-gradient-to-r lg:from-brand-dark/85 lg:via-brand-dark/45 lg:to-transparent" />

      {/* Responsive min-height keeps a consistent band without crushing content on
          small phones; the flex column vertically centres within the nav-cleared
          area. */}
      <div className="relative mx-auto flex min-h-[380px] w-full max-w-[1300px] flex-col justify-center px-5 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:min-h-[460px]">
        {aside ? (
          <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-[1.1fr_minmax(0,420px)]">
            <div className="min-w-0">{children}</div>
            <div className="min-w-0 w-full max-w-md justify-self-center lg:justify-self-end">{aside}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
