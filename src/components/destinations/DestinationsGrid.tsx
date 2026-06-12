// src/components/sections/DestinationsGrid.tsx
'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Tilt3D } from '@/components/ui/3DTilt';

interface Destination {
  seed: string;
  tours: number;
  n: string;
  tag: string;
  d: string;
  alt: string;
  season: string;
  g: string;
}

interface DestinationsGridProps {
  destinations: Destination[];
}

export function DestinationsGrid({ destinations }: DestinationsGridProps) {
  const [displayed, setDisplayed] = useState(8);

  const loadMore = () => {
    setDisplayed((prev) => Math.min(prev + 4, destinations.length));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="mx-auto max-w-[1300px] px-6 pt-8">
      <motion.div
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {destinations.slice(0, displayed).map((dest, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Tilt3D intensity={6}>
              <article className="group overflow-hidden rounded-2xl border border-brand-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="relative h-44 overflow-hidden">
                  <motion.img
                    src={`https://picsum.photos/seed/${dest.seed}/520/380`}
                    alt={dest.n}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-brand-dark/80 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">
                    {dest.tours} Tours
                  </span>
                  <motion.button
                    aria-label={`Save ${dest.n}`}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white hover:text-rose-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                    </svg>
                  </motion.button>
                </div>
                <div className="p-4">
                  <h3 className="text-[17px] font-bold">{dest.n}</h3>
                  <p className="mt-0.5 text-[12px] font-medium text-brand-mute">{dest.tag}</p>
                  <p className="mt-2 min-h-[40px] text-[12.5px] leading-relaxed text-brand-ink/70">{dest.d}</p>
                  <div className="mt-3.5 flex items-center justify-between border-t border-brand-line pt-3 text-[11.5px] font-semibold text-brand-ink/75">
                    <span className="flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                        <path d="m8 21 4-14 4 14M5 21h14M10 13h4" />
                      </svg>
                      {dest.alt}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-mute" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {dest.season}
                    </span>
                  </div>
                </div>
              </article>
            </Tilt3D>
          </motion.div>
        ))}
      </motion.div>

      {displayed < destinations.length && (
        <div className="mt-10 flex justify-center">
          <motion.button
            onClick={loadMore}
            className="flex items-center gap-2 rounded-full border border-brand-line bg-white px-7 py-3 text-[13.5px] font-semibold shadow-soft transition hover:border-brand-green2 hover:text-brand-green2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Load More Destinations
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.button>
        </div>
      )}
    </div>
  );
}