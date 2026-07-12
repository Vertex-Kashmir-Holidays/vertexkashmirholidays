// src/components/tours/TourDetailsReviews.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';

interface Review {
  seed: string;
  name: string;
  avatar?: string | null;
  meta: string;
  quote: string;
}

interface TourDetailsReviewsProps {
  reviews: Review[];
  totalReviews: number;
}

export function TourDetailsReviews({ reviews, totalReviews }: TourDetailsReviewsProps) {
  const [currentReview, setCurrentReview] = useState(0);

  const nextReview = () => setCurrentReview((prev) => (prev + 1) % reviews.length);
  const prevReview = () => setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);

  const review = reviews[currentReview];

  return (
    <motion.section
      id="reviews"
      className="mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[18px] font-bold">
        Reviews{' '}
        <span className="text-[14px] font-semibold text-muted-foreground">
          ({totalReviews.toLocaleString('en-IN')})
        </span>
      </h2>

      {/* Review card — full width */}
      <div className="mt-5 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentReview}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start gap-3.5">
              <Image
                src={imgSrc(review.avatar)}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
                unoptimized
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-[16px] font-bold">{review.name}</p>
                  <span className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                    ))}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground">{review.meta}</p>
              </div>
            </div>

            <p className="mt-3 text-[14px] leading-relaxed text-foreground/75">
              {review.quote}
            </p>
            <a
              href="#"
              className="mt-2 inline-block text-[14px] font-bold text-primary hover:underline"
            >
              View Full Review
            </a>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation: prev | dots | next */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <motion.button
          onClick={prevReview}
          aria-label="Previous review"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ‹
        </motion.button>

        <div className="flex justify-center gap-1.5">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentReview(i)}
              aria-label={`Go to review ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentReview ? 'w-4 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        <motion.button
          onClick={nextReview}
          aria-label="Next review"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ›
        </motion.button>
      </div>
    </motion.section>
  );
}
