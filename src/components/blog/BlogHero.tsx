// src/components/sections/BlogHero.tsx
'use client';

import { motion } from 'framer-motion';

interface BlogHeroProps {
  onSearch: (query: string) => void;
}

export function BlogHero({ onSearch }: BlogHeroProps) {
  return (
    <section className="relative overflow-hidden bg-brand-dark">
      <motion.img
        src="https://picsum.photos/seed/blog-hero/1800/520"
        alt="Houseboats on a Kashmir lake"
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/40 to-brand-dark/20"></div>
      
      <div className="relative mx-auto max-w-[1300px] px-6 py-16 lg:py-28">
        <motion.p
          className="text-[12px] font-bold tracking-[0.32em] text-white/90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          TRAVEL BLOG
        </motion.p>
        <motion.h1
          className="mt-4 text-[38px] font-bold leading-tight text-white lg:text-[42px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Kashmir Stories &amp; Travel Guide
        </motion.h1>
        <motion.p
          className="mt-3 text-[14.5px] text-white/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Real stories, local tips, and travel inspiration from the heart of Kashmir.
        </motion.p>
        <motion.label
          className="mt-7 flex w-full max-w-[350px] items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <input
            id="blogSearch"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-brand-mute"
            placeholder="Search articles, guides, destinations..."
            onChange={(e) => onSearch(e.target.value)}
          />
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-brand-ink/70" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4-4" />
          </svg>
        </motion.label>
      </div>
    </section>
  );
}