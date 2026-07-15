'use client';

// src/components/activities/ActivityNearby.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ActivityCard, type ActivityCardData } from '@/components/activities/ActivityCard';

interface ActivityNearbyProps {
  activities: ActivityCardData[];
}

// Derived automatically (shared destination, excludes current activity, capped
// at 3–4) — no new database relation. Reuses the same ActivityCard as the
// listing page.
//
// Same native scroll-snap mechanics as ActivitiesCarousel/TestimonialsSection
// (.snap-row — real overflow-x-auto, touch-swipeable, and `touch-action:
// pan-x pan-y` so a vertical page-scroll gesture that starts over the row
// isn't captured by the horizontal scroller).
export function ActivityNearby({ activities }: ActivityNearbyProps) {
  if (activities.length === 0) return null;

  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('nearby-activities-row');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 260;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 20) * 2, behavior: 'smooth' });
  };

  return (
    <section id="nearby-activities" className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold">Nearby Activities</h2>
        {activities.length > 1 && (
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

      <div id="nearby-activities-row" className="snap-row mt-4 flex gap-5 overflow-x-auto pb-4">
        {activities.map((a, i) => (
          <div key={a.id} className="w-[260px] shrink-0 sm:w-[300px]">
            <ActivityCard activity={a} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
