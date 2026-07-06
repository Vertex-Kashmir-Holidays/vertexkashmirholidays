// src/components/sections/DestinationsGrid.tsx
'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { DestinationCard } from '@/components/destinations/DestinationCard';

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
    <div className="mx-auto max-w-[1300px] px-3 sm:px-6 pt-8">
      <motion.div
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {destinations.slice(0, displayed).map((dest) => (
          <motion.div key={dest.slug} variants={itemVariants}>
            <DestinationCard dest={dest} />
          </motion.div>
        ))}
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
