// src/components/sections/CampaignFilm.tsx
'use client';

import { motion } from 'framer-motion';

interface CampaignFilmProps {
  posterSeed: string;
  title: string;
  dur: string;
  onFilmClick: () => void;
}

export function CampaignFilm({ posterSeed, title, dur, onFilmClick }: CampaignFilmProps) {
  return (
    <section className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-20">
      <motion.button
        onClick={onFilmClick}
        className="group relative block w-full overflow-hidden rounded-[2rem] border border-white/12 shadow-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={`https://picsum.photos/seed/${posterSeed}/1400/700`}
          alt="Campaign film"
          className="h-[300px] w-full object-cover transition duration-700 group-hover:scale-105 lg:h-[440px]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/30"></span>
        <span className="pulse absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-navy-brand shadow-card transition duration-300 group-hover:scale-110">
          <span className="ml-1 text-xl">▶</span>
        </span>
        <span className="absolute bottom-6 left-7 text-left">
          <span className="block text-[11px] font-extrabold tracking-[0.22em] text-white/70">THE FILM</span>
          <span className="h-display mt-1 block text-2xl font-bold text-white">{title}</span>
        </span>
        <span className="glass absolute bottom-6 right-7 rounded-full px-4 py-2 text-[12px] font-bold text-white">
          ▶ {dur}
        </span>
      </motion.button>
    </section>
  );
}