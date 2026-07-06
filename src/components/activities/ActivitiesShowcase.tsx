'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, ArrowRight } from 'lucide-react';
import { imgSrc } from '@/lib/placeholder';

export interface ShowcaseActivity {
  id: string;
  image: string | null;
  title: string;
  description: string;
  duration?: string | null;
  /** Detail-page link (/activities/[slug]); when set the card is clickable. */
  href?: string;
}

interface Props {
  title: string;
  items: ShowcaseActivity[];
  /** Optional "See all" link to the activities listing. */
  seeAllHref?: string;
}

// Shared "Things to Do" carousel, driven by the Activities module. Used by both
// the destination and tour detail pages (kept in a neutral tree so neither
// public section cross-imports the other). Same 3-visible carousel mechanics
// as BlogPostRelated.
export function ActivitiesShowcase({ title, items, seeAllHref }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1);
      else if (window.innerWidth < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (items.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + itemsPerView >= items.length ? 0 : prev + itemsPerView));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - itemsPerView < 0 ? Math.max(0, items.length - itemsPerView) : prev - itemsPerView));
  };

  const visibleItems = items.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <motion.section
      id="things"
      className="rounded-2xl border border-border bg-card p-6 shadow-soft"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[21px] font-bold">{title}</h2>
        <div className="flex items-center gap-3">
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:gap-1.5"
            >
              See All <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Link>
          )}
          {items.length > itemsPerView && (
            <div className="flex gap-2">
              <motion.button
                onClick={prevSlide}
                aria-label="Previous"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
              </motion.button>
              <motion.button
                onClick={nextSlide}
                aria-label="Next"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {visibleItems.map((thing, i) => (
              <CardShell key={thing.id} href={thing.href}>
                <motion.article
                  className="group/card flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="relative h-[140px] overflow-hidden">
                    <Image
                      src={imgSrc(thing.image)}
                      alt={thing.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover/card:scale-105"
                    />
                    {thing.duration && (
                      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-brand-dark/80 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur">
                        <Clock className="h-2.5 w-2.5" /> {thing.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-[13.5px] font-bold leading-snug transition group-hover/card:text-primary">
                      {thing.title}
                    </h3>
                    {thing.description && (
                      <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted-foreground">
                        {thing.description}
                      </p>
                    )}
                    {thing.href && (
                      <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-primary">
                        View <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                    )}
                  </div>
                </motion.article>
              </CardShell>
            ))}
          </motion.div>
        </AnimatePresence>

        {items.length > itemsPerView && (
          <div className="mt-6 flex justify-center gap-1.5">
            {Array.from({ length: Math.ceil(items.length / itemsPerView) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i * itemsPerView)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === Math.floor(currentIndex / itemsPerView) ? 'w-4 bg-primary' : 'w-1.5 bg-border'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

// Wraps a card in a Link to the activity detail page when an href is provided;
// otherwise renders a plain container (e.g. legacy "things to do" with no slug).
function CardShell({ href, children }: { href?: string; children: React.ReactNode }) {
  if (href) {
    return (
      <Link href={href} className="block h-full">
        {children}
      </Link>
    );
  }
  return <div className="h-full">{children}</div>;
}
