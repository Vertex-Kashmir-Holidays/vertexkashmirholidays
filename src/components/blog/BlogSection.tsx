'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { renderAccents } from '@/lib/accents';
import { imgSrc } from '@/lib/placeholder';
import type { BlogCardData, SectionHeading } from '@/types/home';

interface BlogSectionProps {
  heading: SectionHeading;
  blogs: BlogCardData[];
}

export function BlogSection({ heading, blogs }: BlogSectionProps) {
  if (blogs.length === 0) return null;

  const scroll = (direction: 'prev' | 'next') => {
    const row = document.getElementById('blog-row');
    if (!row) return;
    const width = (row.firstElementChild as HTMLElement)?.offsetWidth || 320;
    row.scrollBy({ left: (direction === 'next' ? 1 : -1) * (width + 24) * 2, behavior: 'smooth' });
  };

  return (
    <section id="blogs" className="relative z-[2] mx-auto max-w-[1300px] px-4 pb-12 pt-16 sm:px-6 sm:pb-10 sm:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[12px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
          <h2 className="rv h-display mt-3 text-[18px] font-bold text-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
            {renderAccents(heading.title)}
          </h2>
        </div>
        <div className="rv flex items-center gap-3" style={{ '--rd': '0.16s' } as React.CSSProperties}>
          {heading.ctaLabel && (
            <Link href={heading.ctaHref ?? '#'} className="text-sm font-bold text-primary hover:underline">
              {heading.ctaLabel}
            </Link>
          )}
          {blogs.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => scroll('prev')}
                aria-label="Previous articles"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.2} />
              </button>
              <button
                onClick={() => scroll('next')}
                aria-label="Next articles"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground shadow-soft transition hover:border-primary hover:text-primary"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>
      </div>
      <div id="blog-row" className="snap-row mt-9 flex gap-6 overflow-x-auto pb-4">
        {blogs.map((b, i) => (
          <Link
            key={b.id}
            href={`/blog/${b.slug}`}
            className="rv tilt glass group relative block w-[300px] shrink-0 overflow-hidden rounded-3xl shadow-card sm:w-[360px]"
            data-tilt
            style={{ '--rd': `${i * 0.09}s` } as React.CSSProperties}
          >
            <div className="shine"></div>
            <div className="relative h-44 overflow-hidden">
              <Image src={imgSrc(b.coverImage)} alt={b.title} fill sizes="(max-width: 768px) 80vw, 360px" className="object-cover transition duration-700 group-hover:scale-110" />
              {b.category && (
                <span className="glass pop-sm absolute left-3 top-3 rounded-full px-3 py-1 text-[12px] font-bold text-white">
                  {b.category}
                </span>
              )}
            </div>
            <div className="pop-sm p-5">
              <p className="text-[12px] text-muted-foreground">
                {[b.dateLabel, b.readTime ? `${b.readTime} min read` : null].filter(Boolean).join(' · ')}
              </p>
              <h3 className="mt-2 font-bold leading-snug text-foreground transition group-hover:text-primary">{b.title}</h3>
              {b.excerpt && <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{b.excerpt}</p>}
              <p className="mt-4 text-xs font-bold text-primary">Read Article →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
