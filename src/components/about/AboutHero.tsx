// src/components/sections/AboutHero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function AboutHero() {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <motion.img
        src="https://picsum.photos/seed/about-hero/1800/640"
        alt="Traveller overlooking a Kashmir valley"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/85 via-brand-dark/45 to-transparent"></div>
      
      <div className="relative mx-auto max-w-[1300px] px-6 py-20 lg:py-24">
        <nav className="flex items-center gap-2 text-[12.5px] text-white/85" aria-label="Breadcrumb">
          <a href="/" className="transition hover:text-white">Home</a>
          <span>›</span>
          <span className="font-semibold text-white">About Us</span>
        </nav>
        <motion.h1
          className="h-display mt-4 font-display text-[44px] font-bold leading-[1.12] text-white lg:text-[52px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Born in <span className="text-brand-mint">Kashmir.</span><br/>
          Built on <span className="text-brand-mint">Trust.</span>
        </motion.h1>
        <motion.p
          className="mt-6 max-w-md text-[14.5px] leading-relaxed text-white/85"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          We are locals, not just planners. We live here, we explore every day, and we design journeys we would take with our own families. Honest pricing, real experiences, unforgettable memories.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3.5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link
            href="#story"
            className="inline-flex items-center gap-2.5 rounded-full bg-brand-bright px-6 py-3 text-[13.5px] font-bold text-white shadow-card transition hover:brightness-110"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20">
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                <path d="M8 5v14l11-7Z" />
              </svg>
            </span>
            Our Story
          </Link>
          <Link
            href="#team"
            className="rounded-full border border-white/55 px-6 py-3 text-[13.5px] font-semibold text-white backdrop-blur transition hover:bg-white hover:text-brand-ink"
          >
            Meet the Team
          </Link>
        </motion.div>
      </div>
    </section>
  );
}