// src/components/sections/TourDetailsItinerary.tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface ItineraryDay {
  day: number;
  title: string;
  body: string;
  image?: string;
}

interface TourDetailsItineraryProps {
  itinerary: ItineraryDay[];
}

export function TourDetailsItinerary({ itinerary }: TourDetailsItineraryProps) {
  const [openDay, setOpenDay] = useState<number>(itinerary[0]?.day || 1);

  return (
    <motion.section
      id="itinerary"
      className="mt-6 rounded-2xl border border-brand-line bg-white p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-bold">
          Itinerary <span className="text-[13px] font-semibold text-brand-mute">(Day by Day)</span>
        </h2>
        <button
          onClick={() => setOpenDay(0)}
          className="text-[12px] font-semibold text-brand-green2 hover:underline"
        >
          Collapse All
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {itinerary.map((day) => {
          const isOpen = openDay === day.day;

          return (
            <motion.div
              key={day.day}
              className={`overflow-hidden rounded-xl ${
                isOpen
                  ? 'border-l-[3px] border-brand-bright bg-brand-page'
                  : 'border border-brand-line'
              }`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: day.day * 0.05 }}
            >
              <button
                onClick={() => setOpenDay(isOpen ? 0 : day.day)}
                className="flex w-full cursor-pointer items-center gap-4 px-4 py-3.5"
              >
                <span
                  className={`text-[13px] font-extrabold ${
                    isOpen ? 'text-brand-green2' : ''
                  }`}
                >
                  Day {day.day}
                </span>
                <span className="flex-1 text-[13.5px] font-bold text-left">
                  {day.title}
                </span>
                <motion.svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 text-brand-mute transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </motion.svg>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    className="flex flex-wrap items-start gap-4 px-4 pb-4 md:flex-nowrap"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-brand-ink/70">
                      {day.body}
                    </p>
                    {day.image && (
                      <img
                        src={`https://picsum.photos/seed/${day.image}/300/200`}
                        alt=""
                        className="h-[88px] w-[140px] shrink-0 rounded-lg object-cover"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}