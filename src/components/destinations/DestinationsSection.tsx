'use client';

import Link from 'next/link';
import Image from 'next/image';
import { renderAccents } from '@/lib/accents';
import type { DestinationCardData, SectionHeading } from '@/types/home';

interface DestinationsSectionProps {
  heading: SectionHeading;
  destinations: DestinationCardData[];
}

// First card spans the bento grid; the rest fill single cells.
const cellClasses = ['md:col-span-2 md:row-span-2 h-[260px] md:h-full', 'h-[200px]'];

export function DestinationsSection({ heading, destinations }: DestinationsSectionProps) {
  if (destinations.length === 0) return null;

  return (
    <section id="destinations" className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
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
      <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
        {destinations.map((d, i) => (
          <Link
            key={d.id}
            href={`/destinations/${d.slug}`}
            className={`rv group relative block overflow-hidden rounded-3xl border border-border ${cellClasses[Math.min(i, 1)]}`}
            style={{ '--rd': `${i * 0.07}s` } as React.CSSProperties}
          >
            {d.coverImage && (
              <Image
                src={d.coverImage}
                alt={d.name}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
            <div className="absolute inset-x-0 bottom-0 p-5 transition duration-300 group-hover:-translate-y-1">
              <h3 className="h-display text-2xl font-bold text-white">{d.name}</h3>
              {d.tagline && <p className="text-[12px] text-white/65">{d.tagline}</p>}
            </div>
            <span className="glass absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-white opacity-0 transition duration-300 group-hover:opacity-100">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
