'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Tilt3D } from '@/components/ui/3DTilt';
import { imgSrc } from '@/lib/placeholder';

export interface TourCategoryCardData {
  slug: string;
  pageTitle: string;
  emoji: string;
  cardDescription: string;
  tourCount: number;
  image: string | null;
}

interface TourCategoryHubGridProps {
  categories: TourCategoryCardData[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// Dynamic grid for the /tours/category hub — renders whatever categories
// currently have at least one published tour, so a category that goes from
// one tour to many (or a brand-new category) needs no code change here.
export function TourCategoryHubGrid({ categories }: TourCategoryHubGridProps) {
  if (categories.length === 0) return null;

  return (
    <motion.div
      className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
    >
      {categories.map((c) => (
        <motion.div key={c.slug} variants={itemVariants}>
          <Tilt3D intensity={6}>
            <Link href={`/tours/category/${c.slug}`} aria-label={`Explore ${c.pageTitle}`} className="block h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={imgSrc(c.image)}
                    alt={c.pageTitle}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-md bg-brand-dark/80 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur">
                    {c.tourCount} {c.tourCount === 1 ? 'Tour' : 'Tours'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="flex items-center gap-2 text-[18px] font-bold text-foreground">
                    <span aria-hidden="true">{c.emoji}</span>
                    {c.pageTitle}
                  </h3>
                  <p className="mt-2 min-h-[40px] flex-1 text-[14px] leading-relaxed text-foreground/70">
                    {c.cardDescription}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
                    Explore Category
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} />
                  </span>
                </div>
              </article>
            </Link>
          </Tilt3D>
        </motion.div>
      ))}
    </motion.div>
  );
}
