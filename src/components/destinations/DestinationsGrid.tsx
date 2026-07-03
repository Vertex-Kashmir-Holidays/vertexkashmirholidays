// src/components/sections/DestinationsGrid.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { Heart, Thermometer, Calendar, ChevronDown } from 'lucide-react';
import { Tilt3D } from '@/components/ui/3DTilt';
import { imgSrc } from '@/lib/placeholder';

export interface DestinationCardData {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  coverImage: string | null;
  temperature: number | null;
  season: string | null;
  region: string;
  tours: number;
}

interface DestinationsGridProps {
  destinations: DestinationCardData[];
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
        {destinations.slice(0, displayed).map((dest) => {
          const image = imgSrc(dest.coverImage);
          return (
          <motion.div key={dest.slug} variants={itemVariants}>
            <Tilt3D intensity={6}>
              <Link href={`/destinations/${dest.slug}`} aria-label={`View ${dest.name}`} className="block">
              <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={image}
                    alt={dest.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-brand-dark/80 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">
                    {dest.tours} {dest.tours === 1 ? 'Tour' : 'Tours'}
                  </span>
                  <motion.button
                    aria-label={`Save ${dest.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition hover:bg-white hover:text-rose-500"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart className="h-4 w-4" strokeWidth={2} />
                  </motion.button>
                </div>
                <div className="p-4">
                  <h3 className="text-[17px] font-bold">{dest.name}</h3>
                  {dest.tagline && <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">{dest.tagline}</p>}
                  {dest.description && <p className="mt-2 min-h-[40px] text-[12.5px] leading-relaxed text-foreground/70">{dest.description}</p>}
                  {(dest.temperature != null || dest.season) && (
                    <div className="mt-3.5 flex items-center justify-between border-t border-border pt-3 text-[11.5px] font-semibold text-foreground/75">
                      {dest.temperature != null && (
                        <span className="flex items-center gap-1.5">
                          <Thermometer className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                          {dest.temperature}°C
                        </span>
                      )}
                      {dest.season && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                          {dest.season}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </article>
              </Link>
            </Tilt3D>
          </motion.div>
          );
        })}
      </motion.div>

      {displayed < destinations.length && (
        <div className="mt-10 flex justify-center">
          <motion.button
            onClick={loadMore}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-[13.5px] font-semibold shadow-soft transition hover:border-primary hover:text-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Load More Destinations
            <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
          </motion.button>
        </div>
      )}
    </div>
  );
}