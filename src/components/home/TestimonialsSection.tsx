'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { renderAccents } from '@/lib/accents';
import type { SectionHeading, TestimonialData } from '@/types/home';

interface TestimonialsSectionProps {
  heading: SectionHeading;
  testimonials: TestimonialData[];
}

export function TestimonialsSection({ heading, testimonials }: TestimonialsSectionProps) {
  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('trow');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 340;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 20) * 2, behavior: 'smooth' });
  };

  if (testimonials.length === 0) return null;

  return (
    <section id="testimonials" className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[11px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
          <h2 className="rv h-display mt-3 text-[17px] font-bold text-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
            {renderAccents(heading.title)}
          </h2>
        </div>
        <div className="rv flex items-center gap-3" style={{ '--rd': '0.16s' } as React.CSSProperties}>
          <Link
            href="/reviews"
            className="flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline"
          >
            View all reviews
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </Link>
          <button
            onClick={() => scroll('prev')}
            aria-label="Previous testimonials"
            className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:bg-foreground/10"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <button
            onClick={() => scroll('next')}
            aria-label="Next testimonials"
            className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:bg-foreground/10"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <div id="trow" className="snap-row mt-9 flex gap-5 overflow-x-auto pb-4">
        {testimonials.map((t, i) => (
          <article key={t.id} className="rv glass relative w-[300px] sm:w-[340px] shrink-0 rounded-3xl p-6 shadow-card" style={{ '--rd': `${i * 0.07}s` } as React.CSSProperties}>
            <p className="font-display text-5xl leading-none text-primary/50">"</p>
            <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-muted-foreground">{t.quote}</p>
            <Link href="/reviews" className="mt-1 inline-block text-[12.5px] font-bold text-primary hover:underline">
              Show more
            </Link>
            <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
              {t.avatar && (
                <Image src={t.avatar} alt="" width={40} height={40} className="h-10 w-10 rounded-full border border-border object-cover" unoptimized />
              )}
              <div>
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                {t.location && <p className="text-[11px] text-muted-foreground">{t.location}</p>}
              </div>
              <span className="ml-auto flex gap-0.5 text-amber-300">
                {Array.from({ length: Math.max(1, Math.min(5, t.rating)) }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                ))}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
