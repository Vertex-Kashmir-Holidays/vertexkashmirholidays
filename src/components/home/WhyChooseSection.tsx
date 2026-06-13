'use client';

import { renderAccents } from '@/lib/accents';
import type { SectionHeading, WhyChooseItemData } from '@/types/home';

interface WhyChooseSectionProps {
  heading: SectionHeading;
  items: WhyChooseItemData[];
}

export function WhyChooseSection({ heading, items }: WhyChooseSectionProps) {
  if (items.length === 0) return null;

  return (
    <section id="why" className="relative z-[2] mx-auto max-w-[1300px] px-6 pt-16 sm:pt-24">
      <div className="text-center">
        <p className="rv text-[11px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
        <h2 className="rv h-display mt-3 text-3xl sm:text-4xl font-bold text-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
          {renderAccents(heading.title)}
        </h2>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((w, i) => (
          <article key={w.id} className="rv tilt glass relative rounded-3xl p-6 text-center shadow-card" data-tilt style={{ '--rd': `${i * 0.08}s` } as React.CSSProperties}>
            <div className="shine"></div>
            <div className="pop">
              <span className="glass-strong mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl shadow-card">
                {w.emoji}
              </span>
              <h3 className="mt-5 font-bold text-foreground">{w.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{w.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
