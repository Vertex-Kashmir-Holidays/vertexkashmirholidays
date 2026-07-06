'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ActivityCard, type ActivityCardData } from '@/components/activities/ActivityCard';

interface ActivitiesCarouselProps {
  title: string;
  items: ActivityCardData[];
  seeAllHref?: string;
}

// Same 3-visible carousel mechanics as ActivitiesShowcase / BlogPostRelated,
// but renders the exact same ActivityCard used on the /activities listing
// page — so any future change to that card reflects everywhere it's used.
export function ActivitiesCarousel({ title, items, seeAllHref }: ActivitiesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else if (window.innerWidth < 1280) setItemsPerView(3);
      else setItemsPerView(4);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (items.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + itemsPerView >= items.length ? 0 : prev + itemsPerView));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - itemsPerView < 0 ? Math.max(0, items.length - itemsPerView) : prev - itemsPerView));
  };

  const visibleItems = items.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <section id="things-to-do">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="h-display text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">{title}</h2>
        <div className="ml-auto flex items-center gap-3">
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:gap-1.5"
            >
              See All <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Link>
          )}
          {items.length > itemsPerView && (
            <div className="flex gap-2">
              <motion.button
                onClick={prevSlide}
                aria-label="Previous"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
              </motion.button>
              <motion.button
                onClick={nextSlide}
                aria-label="Next"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {visibleItems.map((activity, i) => (
              <ActivityCard key={activity.id} activity={activity} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>

        {items.length > itemsPerView && (
          <div className="mt-8 flex justify-center gap-1.5">
            {Array.from({ length: Math.ceil(items.length / itemsPerView) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i * itemsPerView)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === Math.floor(currentIndex / itemsPerView) ? 'w-4 bg-primary' : 'w-1.5 bg-border'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
