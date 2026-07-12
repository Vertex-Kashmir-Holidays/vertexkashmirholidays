'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';

// Same "Featured Story" treatment as BlogFeaturedStory — adapted for a tour
// package instead of an article, so category landing pages read consistently
// with the rest of the site's listing pages.
export interface TourCategoryFeaturedData {
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  duration: number;
  places: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  priceWas: number | null;
}

export function TourCategoryFeatured({ tour }: { tour: TourCategoryFeaturedData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-[20px] font-bold">Featured Package</h2>
      <article className="mt-4 grid overflow-hidden rounded-2xl border border-border bg-card shadow-soft md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col p-6 lg:p-7">
          <span className="w-fit rounded-md bg-primary px-2.5 py-1 text-[12px] font-extrabold tracking-wide text-primary-foreground">
            FEATURED
          </span>
          <h3 className="mt-4 text-[24px] font-bold leading-snug">{tour.title}</h3>
          {tour.excerpt && <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{tour.excerpt}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] text-muted-foreground">
            <span>{Math.max(tour.duration - 1, 0)}N / {tour.duration}D</span>
            {tour.places && <span>{tour.places}</span>}
            <span className="flex items-center gap-1 font-semibold text-foreground">
              {tour.rating.toFixed(1)}
              <Star className="h-3.5 w-3.5 text-amber-400" strokeWidth={0} fill="currentColor" />
              <span className="font-normal text-muted-foreground">({tour.reviewCount})</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[22px] font-extrabold">₹{tour.priceFrom.toLocaleString('en-IN')}</span>
            {tour.priceWas && (
              <span className="text-[14px] font-semibold text-muted-foreground line-through">
                ₹{tour.priceWas.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-[12px] text-muted-foreground">per person</span>
          </div>
          <Link
            href={`/tours/${tour.slug}`}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110"
          >
            View Full Itinerary
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
        </div>
        <div className="relative min-h-[220px]">
          <Image
            src={imgSrc(tour.image)}
            alt={tour.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </article>
    </motion.div>
  );
}
