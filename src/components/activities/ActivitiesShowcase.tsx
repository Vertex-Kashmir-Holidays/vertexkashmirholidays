'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Clock, ArrowRight } from 'lucide-react';
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

// Shared "Things to Do" card row, driven by the Activities module. Used by both
// the destination and tour detail pages (kept in a neutral tree so neither
// public section cross-imports the other).
export function ActivitiesShowcase({ title, items, seeAllHref }: Props) {
  if (items.length === 0) return null;

  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('thingsRow');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 160;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 16) * 2, behavior: 'smooth' });
  };

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
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition hover:gap-1.5"
          >
            See All <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        )}
      </div>
      <div className="relative mt-5">
        <div className="snap-row scrollbar-none flex gap-4 overflow-x-auto pb-1" id="thingsRow">
          {items.map((thing, i) => (
            <motion.article
              key={thing.id}
              className="w-[160px] shrink-0"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <CardShell href={thing.href}>
                <div className="group relative h-[150px] overflow-hidden rounded-xl">
                  <Image
                    src={imgSrc(thing.image)}
                    alt={thing.title}
                    fill
                    sizes="160px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  {thing.duration && (
                    <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-brand-dark/80 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur">
                      <Clock className="h-2.5 w-2.5" /> {thing.duration}
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-[13.5px] font-bold leading-snug transition group-hover/card:text-primary">{thing.title}</h3>
              </CardShell>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{thing.description}</p>
            </motion.article>
          ))}
        </div>
        {items.length > 2 && (
          <motion.button
            onClick={() => scroll('next')}
            aria-label="Next"
            className="absolute -right-3 top-[72px] grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-card transition hover:text-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.4} />
          </motion.button>
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
      <Link href={href} className="group/card block">
        {children}
      </Link>
    );
  }
  return <div className="group/card">{children}</div>;
}
