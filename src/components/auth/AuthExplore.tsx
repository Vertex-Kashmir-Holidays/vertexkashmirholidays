// src/components/sections/AuthExplore.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function AuthExplore() {
  return (
    <motion.div
      className="relative flex items-center overflow-hidden rounded-3xl bg-card p-7 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <img
        src="/hero/gulmarg-lg.webp"
        alt="Meadows of Gulmarg, Kashmir"
        className="absolute inset-y-0 left-0 hidden h-full w-[42%] rounded-r-[40%] object-cover sm:block"
      />
      <div className="relative ml-0 sm:ml-[44%]">
        <h2 className="font-display text-[20px] font-bold leading-snug">
          New to Vertex <span className="text-primary">Kashmir?</span>
        </h2>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">Check out our popular tours</p>
        <Link
          href="/tours"
          className="mt-4 inline-flex items-center gap-2 rounded-full border-[1.5px] border-primary px-5 py-2.5 text-[12.5px] font-bold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          Explore Tours
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}