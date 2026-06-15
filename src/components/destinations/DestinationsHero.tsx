// src/components/sections/DestinationsHero.tsx
'use client';

import { motion } from 'framer-motion';

export function DestinationsHero() {
  const badges = [
    { t: 'Handpicked', s: 'by local experts', icon: 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' },
    { t: 'Real Experiences', s: 'not tourist traps', icon: 'm9 12 2 2 4-5' },
    { t: 'Best Price', s: 'guaranteed', icon: 'M12 7v1m0 8v1m2.5-7.5c0-1-1.1-1.7-2.5-1.7s-2.5.7-2.5 1.6c0 2.4 5 1.4 5 3.8 0 .9-1.1 1.6-2.5 1.6s-2.5-.7-2.5-1.7' },
  ];

  return (
    <section className="relative overflow-hidden bg-brand-dark pb-10">
      <picture className="absolute inset-0 block h-full w-full">
        <source media="(max-width: 640px)" srcSet="/hero/srinagar.webp" />
        <img
          src="/hero/srinagar-lg.webp"
          alt="Dal Lake, Kashmir"
          className="h-full w-full object-cover"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/40 to-transparent"></div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent"></div>

      <div className="relative mx-auto max-w-[1300px] px-6 py-20 lg:py-24">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          <a href="/" className="transition hover:text-white">Home</a>
          <span>›</span>
          <span className="font-semibold text-white">Destinations</span>
        </nav>

        <motion.h1
          className="mt-7 max-w-xl text-4xl font-bold leading-[1.15] text-white lg:text-[42px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Explore the breathtaking destinations of Kashmir
        </motion.h1>
        <motion.p
          className="mt-5 max-w-md text-[15px] leading-relaxed text-white/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          From snow-capped peaks to serene valleys and crystal clear lakes – discover paradise on earth.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-wrap gap-3.5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/25 bg-black/35 px-4 py-2.5 backdrop-blur"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30 text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={badge.icon} />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block text-[13px] font-bold text-white">{badge.t}</span>
                <span className="block text-[11px] text-white/70">{badge.s}</span>
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}