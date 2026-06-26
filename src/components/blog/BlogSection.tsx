'use client';

import Link from 'next/link';
import Image from 'next/image';
import { renderAccents } from '@/lib/accents';
import { imgSrc } from '@/lib/placeholder';
import type { BlogCardData, SectionHeading } from '@/types/home';

interface BlogSectionProps {
  heading: SectionHeading;
  blogs: BlogCardData[];
}

export function BlogSection({ heading, blogs }: BlogSectionProps) {
  if (blogs.length === 0) return null;

  return (
    <section id="blogs" className="relative z-[2] mx-auto max-w-[1300px] px-4 pb-12 pt-16 sm:px-6 sm:pb-10 sm:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rv text-[11px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
          <h2 className="rv h-display mt-3 text-3xl sm:text-4xl font-bold text-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
            {renderAccents(heading.title)}
          </h2>
        </div>
        {heading.ctaLabel && (
          <Link href={heading.ctaHref ?? '#'} className="rv text-sm font-bold text-primary hover:underline" style={{ '--rd': '0.16s' } as React.CSSProperties}>
            {heading.ctaLabel}
          </Link>
        )}
      </div>
      <div className="mt-9 grid gap-6 md:grid-cols-3">
        {blogs.map((b, i) => (
          <Link key={b.id} href={`/blog/${b.slug}`} className="rv tilt glass group relative block overflow-hidden rounded-3xl shadow-card" data-tilt style={{ '--rd': `${i * 0.09}s` } as React.CSSProperties}>
            <div className="shine"></div>
            <div className="relative h-44 overflow-hidden">
              <Image src={imgSrc(b.coverImage)} alt={b.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-110" />
              {b.category && (
                <span className="glass pop-sm absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold text-white">
                  {b.category}
                </span>
              )}
            </div>
            <div className="pop-sm p-5">
              <p className="text-[11px] text-muted-foreground">
                {[b.dateLabel, b.readTime ? `${b.readTime} min read` : null].filter(Boolean).join(' · ')}
              </p>
              <h3 className="mt-2 font-bold leading-snug text-foreground transition group-hover:text-primary">{b.title}</h3>
              {b.excerpt && <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{b.excerpt}</p>}
              <p className="mt-4 text-xs font-bold text-primary">Read Article →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
