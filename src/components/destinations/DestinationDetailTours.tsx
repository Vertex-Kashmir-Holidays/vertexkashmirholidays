// src/components/sections/DestinationDetailTours.tsx
"use client";

import { TourCard } from "@/components/ui/organisms/TourCard";
import { motion } from "framer-motion";

export interface DestinationTour {
  badge: string;
  bc: "orange" | "blue" | "green";
  seed?: string;
  image?: string;
  bookHref?: string;
  whatsappHref?: string;
  t: string;
  d: string;
  places: string;
  r: string;
  n: string;
  old?: string;
  p: string;
  inclusions?: {
    transfers?: boolean;
    hotel?: string;
    meals?: boolean;
    shikara?: boolean;
  };
}

interface DestinationDetailToursProps {
  name: string;
  tours: DestinationTour[];
}

export function DestinationDetailTours({ name, tours }: DestinationDetailToursProps) {
  const scroll = (direction: "prev" | "next") => {
    const row = document.getElementById("tourRow");
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 180;
    row.scrollBy({ left: (direction === "next" ? 1 : -1) * (width + 16) * 3, behavior: "smooth" });
  };

  return (
    <motion.section
      id="tours"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-bold">Featured Tours in {name}</h2>
        <div className="flex items-center gap-3">
          <a href="/tours" className="text-[14px] font-bold text-primary hover:underline">
            View full tours
          </a>
          <motion.button
            onClick={() => scroll("prev")}
            aria-label="Previous tours"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ‹
          </motion.button>
          <motion.button
            onClick={() => scroll("next")}
            aria-label="Next tours"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ›
          </motion.button>
        </div>
      </div>
      <div className="snap-row scrollbar-none mt-5 flex gap-4 overflow-x-auto pb-1" id="tourRow">
        {tours.map((tour, i) => (
          <div key={i} className="w-[calc(100vw-7rem)] shrink-0 sm:w-[220px] lg:w-[280px]">
            <TourCard key={i} tour={tour} index={i} variant="tours" />
          </div>
        ))}
      </div>
    </motion.section>
  );
}
