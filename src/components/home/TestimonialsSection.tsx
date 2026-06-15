'use client';

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
          <h2 className="rv h-display mt-3 text-3xl sm:text-4xl font-bold text-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
            {renderAccents(heading.title)}
          </h2>
        </div>
        <div className="rv flex gap-2" style={{ '--rd': '0.16s' } as React.CSSProperties}>
          <button
            onClick={() => scroll('prev')}
            className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:bg-foreground/10"
          >
            ←
          </button>
          <button
            onClick={() => scroll('next')}
            className="glass grid h-11 w-11 place-items-center rounded-full text-foreground transition hover:bg-foreground/10"
          >
            →
          </button>
        </div>
      </div>
      <div id="trow" className="snap-row mt-9 flex gap-5 overflow-x-auto pb-4">
        {testimonials.map((t, i) => (
          <article key={t.id} className="rv glass relative w-[300px] sm:w-[340px] shrink-0 rounded-3xl p-6 shadow-card" style={{ '--rd': `${i * 0.07}s` } as React.CSSProperties}>
            <p className="font-display text-5xl leading-none text-primary/50">"</p>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{t.quote}</p>
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              {t.avatar && (
                <img src={t.avatar} alt="" className="h-10 w-10 rounded-full border border-border object-cover" />
              )}
              <div>
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                {t.location && <p className="text-[11px] text-muted-foreground">{t.location}</p>}
              </div>
              <span className="ml-auto text-amber-300">{'★'.repeat(Math.max(1, Math.min(5, t.rating)))}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
