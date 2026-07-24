// src/components/about/AboutJourney.tsx
"use client";

import { motion } from "framer-motion";
import { renderMint } from "@/lib/accents";
import type { AboutSectionHeading, JourneyMilestoneData } from "@/types/about";

interface AboutJourneyProps {
  heading: AboutSectionHeading;
  journey: JourneyMilestoneData[];
}

export function AboutJourney({ heading, journey }: AboutJourneyProps) {
  if (journey.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1300px] px-6 pb-14">
      <motion.div
        className="rounded-2xl bg-muted p-7 lg:p-9"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid items-center gap-8 lg:grid-cols-[230px_1fr]">
          <div>
            <p className="text-[12px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
            <h2 className="h-display mt-3 font-display text-[18px] font-bold leading-snug">
              {renderMint(heading.title)}
            </h2>
          </div>
          <div className="scrollbar-none overflow-x-auto">
            <div className="relative min-w-[760px] pt-2">
              <div className="absolute left-0 right-0 top-[58px] h-px bg-primary/40"></div>
              <div className="relative grid grid-cols-6 gap-3">
                {journey.map((j, i) => (
                  <motion.div
                    key={j.id}
                    className="text-center"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-primary/30 bg-card text-primary shadow-soft">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={j.icon} />
                      </svg>
                    </span>
                    <span className="mx-auto mt-2 block h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-muted"></span>
                    <p className="mt-2.5 text-[16px] font-extrabold">{j.year}</p>
                    <p className="mx-auto mt-1 max-w-[120px] text-[12px] leading-relaxed text-muted-foreground">
                      {j.detail}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
