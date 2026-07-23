// src/components/sections/TourDetailsFitCheck.tsx
"use client";

import { motion } from "framer-motion";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { fadeUp, fadeLeft, viewportOnce } from "@/lib/motion";

interface TourDetailsFitCheckProps {
  perfectFor: string[];
  notIdealFor: string[];
}

export function TourDetailsFitCheck({ perfectFor, notIdealFor }: TourDetailsFitCheckProps) {
  if (perfectFor.length === 0 && notIdealFor.length === 0) return null;

  return (
    <motion.section
      id="fit"
      className="mt-6 grid gap-5 md:grid-cols-2"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ duration: 0.5 }}
    >
      {perfectFor.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
          <h2 className="text-[18px] font-bold">Perfect For</h2>
          <ul className="mt-4 space-y-3 text-[14px] text-foreground/80">
            {perfectFor.map((item, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2.5"
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                  <ThumbsUp className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {notIdealFor.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
          <h2 className="text-[18px] font-bold">Not Ideal For</h2>
          <ul className="mt-4 space-y-3 text-[14px] text-foreground/80">
            {notIdealFor.map((item, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-2.5"
                variants={fadeLeft}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                transition={{ delay: i * 0.05 }}
              >
                <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-red-500 text-white">
                  <ThumbsDown className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
