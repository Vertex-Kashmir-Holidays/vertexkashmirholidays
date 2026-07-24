// src/components/sections/TourDetailsOverview.tsx
"use client";

import { motion } from "framer-motion";

interface TourDetailsOverviewProps {
  description: string;
  whyItineraryWorks?: string;
}

export function TourDetailsOverview({ description, whyItineraryWorks }: TourDetailsOverviewProps) {
  return (
    <motion.section
      id="overview"
      className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[18px] font-bold">Overview</h2>
      <p className="mt-3 text-[14px] leading-relaxed text-foreground/75">{description}</p>
      {whyItineraryWorks && (
        <div className="mt-5 rounded-xl border border-border bg-muted/50 p-4">
          <h3 className="text-[14px] font-bold">Why This Itinerary Works</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-foreground/75">
            {whyItineraryWorks}
          </p>
        </div>
      )}
    </motion.section>
  );
}
