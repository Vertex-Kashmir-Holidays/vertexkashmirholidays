// src/components/destinations/DestinationNearby.tsx
"use client";

import { DestinationCard } from "@/components/destinations/DestinationCard";
import type { DestinationCardData } from "@/components/destinations/DestinationsGrid";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface DestinationNearbyProps {
  destinations: DestinationCardData[];
}

// Same 3-visible carousel mechanics as ActivitiesShowcase / BlogPostRelated —
// reuses the exact same destination card as the /destinations listing page.
export function DestinationNearby({ destinations }: DestinationNearbyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (destinations.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + itemsPerView >= destinations.length ? 0 : prev + itemsPerView,
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev - itemsPerView < 0
        ? Math.max(0, destinations.length - itemsPerView)
        : prev - itemsPerView,
    );
  };

  const visibleDestinations = destinations.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <section
      id="nearby"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold">Nearby Destinations</h2>
        {destinations.length > itemsPerView && (
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

      <div className="relative mt-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {visibleDestinations.map((dest) => (
              <DestinationCard key={dest.slug} dest={dest} />
            ))}
          </motion.div>
        </AnimatePresence>

        {destinations.length > itemsPerView && (
          <div className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: Math.ceil(destinations.length / itemsPerView) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i * itemsPerView)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === Math.floor(currentIndex / itemsPerView)
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-border"
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
