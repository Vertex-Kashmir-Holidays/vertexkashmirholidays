// src/components/sections/TourDetailsAccommodation.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { imgSrc } from "@/lib/placeholder";
import type { AccommodationEntry } from "@/types/tours";

interface TourDetailsAccommodationProps {
  accommodation: AccommodationEntry[];
  image?: string;
}

export function TourDetailsAccommodation({ accommodation, image }: TourDetailsAccommodationProps) {
  if (accommodation.length === 0) return null;

  return (
    <motion.section
      id="accommodation"
      className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-[18px] font-bold">Accommodation</h2>
          <ul className="mt-4 space-y-3.5 text-[14px] text-foreground/80">
            {accommodation.map((entry, i) => (
              <li key={i}>
                <p className="font-bold text-foreground">{entry.location}</p>
                <p className="mt-0.5 leading-relaxed text-foreground/70">{entry.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative h-56 w-full overflow-hidden rounded-xl md:h-full md:min-h-[220px]">
          <Image
            src={imgSrc(image)}
            alt="Accommodation"
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
          />
        </div>
      </div>
    </motion.section>
  );
}
