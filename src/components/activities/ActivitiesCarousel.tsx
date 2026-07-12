'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ActivityCard, type ActivityCardData } from '@/components/activities/ActivityCard';

interface ActivitiesCarouselProps {
  title: string;
  items: ActivityCardData[];
  seeAllHref?: string;
}

// Same native scroll-snap mechanics as TestimonialsSection/VideoReviewsSection
// (.snap-row — real overflow-x-auto, touch-swipeable) — replaces an earlier
// version that only advanced via the prev/next buttons and had no touch
// support at all on mobile.
export function ActivitiesCarousel({ title, items, seeAllHref }: ActivitiesCarouselProps) {
  if (items.length === 0) return null;

  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('activities-row');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 280;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 20) * 2, behavior: 'smooth' });
  };

  return (
    <section id="things-to-do">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="h-display text-[18px] font-bold text-foreground">{title}</h2>
        <div className="ml-auto flex items-center gap-3">
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="inline-flex items-center gap-1 text-[14px] font-semibold text-primary transition hover:gap-1.5"
            >
              See All <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </Link>
          )}
          {items.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => scroll('prev')}
                aria-label="Previous"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => scroll('next')}
                aria-label="Next"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div id="activities-row" className="snap-row mt-8 flex gap-5 overflow-x-auto pb-4">
        {items.map((activity, i) => (
          <div key={activity.id} className="w-[260px] shrink-0 sm:w-[300px]">
            <ActivityCard activity={activity} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
