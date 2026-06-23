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
}

export function SecondaryHero({ image, imageMobile, alt = '', children }: SecondaryHeroProps) {
  return (
    <section className="relative min-h-[360px] overflow-hidden bg-brand-dark">
      {image && (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <picture className="block h-full w-full">
            {imageMobile && <source media="(max-width: 640px)" srcSet={imageMobile} />}
            <img src={image} alt={alt} className="h-full w-full object-cover" />
          </picture>
        </motion.div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/45 to-transparent" />

      {/* min-h matches the section so short heroes still fill the band; the
          flex column vertically centres content within the nav-cleared area. */}
      <div className="relative mx-auto flex min-h-[360px] w-full max-w-[1300px] flex-col justify-center px-5 pb-12 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
        {children}
      </div>
    </section>
  );
}
