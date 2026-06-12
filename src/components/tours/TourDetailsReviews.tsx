// src/components/sections/TourDetailsReviews.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Review {
  seed: string;
  name: string;
  meta: string;
  quote: string;
}

interface TourDetailsReviewsProps {
  reviews: Review[];
  totalReviews: number;
}

export function TourDetailsReviews({ reviews, totalReviews }: TourDetailsReviewsProps) {
  const [currentReview, setCurrentReview] = useState(0);

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <motion.section
      id="reviews"
      className="mt-6 rounded-2xl border border-brand-line bg-white p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[17px] font-bold">
        Reviews <span className="text-[13px] font-semibold text-brand-mute">({totalReviews.toLocaleString()})</span>
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <motion.button
          onClick={prevReview}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand-line text-brand-mute shadow-soft transition hover:border-brand-green2 hover:text-brand-green2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ‹
        </motion.button>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentReview}
              className="flex items-start gap-3.5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={`https://picsum.photos/seed/${reviews[currentReview].seed}/80`}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-[14px] font-bold">{reviews[currentReview].name}</p>
                  <span className="text-amber-400">★★★★★</span>
                </div>
                <p className="text-[11.5px] text-brand-mute">{reviews[currentReview].meta}</p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-brand-ink/75">
                  {reviews[currentReview].quote}
                </p>
                <a href="#" className="mt-2 inline-block text-[12px] font-bold text-brand-green2 hover:underline">
                  View Full Review
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.button
          onClick={nextReview}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand-line text-brand-mute shadow-soft transition hover:border-brand-green2 hover:text-brand-green2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ›
        </motion.button>
      </div>

      <div className="mt-5 flex justify-center gap-1.5">
        {reviews.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentReview ? 'w-4 bg-brand-green2' : 'w-1.5 bg-brand-line'
            }`}
          />
        ))}
      </div>
    </motion.section>
  );
}