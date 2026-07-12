'use client';

import { motion } from 'framer-motion';
import { TourCard } from '@/components/ui/TourCard';

interface TourCategoryRecommendedProps {
  tours: React.ComponentProps<typeof TourCard>['tour'][];
}

export function TourCategoryRecommended({ tours }: TourCategoryRecommendedProps) {
  if (tours.length === 0) return null;
  return (
    <motion.section
      className="mt-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[20px] font-bold">Recommended Packages</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tours.map((tour, i) => (
          <TourCard key={tour.detailHref ?? i} tour={tour} index={i} variant="tours" />
        ))}
      </div>
    </motion.section>
  );
}
