'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { TourCard } from '@/components/ui/TourCard';
import { formatINR } from '@/lib/accents';
import { imgSrc } from '@/lib/placeholder';

const BADGE_COLORS = ['orange', 'blue', 'green'] as const;

interface SpotlightTour {
  id: string;
  slug: string;
  title: string;
  badge: string | null;
  badgeColor: string | null;
  duration: number;
  coverImage: string | null;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  priceWas: number | null;
  destinations: { destination: { name: string } }[];
}

interface SpotlightBlog {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readTime: number | null;
}

interface SpotlightResponse {
  tour: SpotlightTour | null;
  blog: SpotlightBlog | null;
}

function CardSkeleton() {
  return (
    <div className="h-64 animate-pulse rounded-2xl border border-border bg-muted" />
  );
}

function BlogSpotlightCard({ blog }: { blog: SpotlightBlog }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative h-32 overflow-hidden">
        <Image
          src={imgSrc(blog.coverImage)}
          alt={blog.title}
          fill
          sizes="360px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-md bg-brand-dark/80 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur">
          From the Blog
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-[15px] font-bold leading-snug text-foreground transition group-hover:text-primary">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{blog.excerpt}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary">
          Read Article
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} />
        </span>
      </div>
    </Link>
  );
}

// Sidebar for the /tours/category hub — one package card and one blog card,
// fetched from /api/spotlight after mount so they're different on every
// visit without making the (ISR-cached) page itself dynamic.
export function TourCategoryHubSpotlight() {
  const [data, setData] = useState<SpotlightResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/spotlight', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ tour: null, blog: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="space-y-5">
      {data === null ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : (
        <>
          {data.tour && (
            <TourCard
              tour={{
                badge: data.tour.badge ?? 'FEATURED',
                bc: (BADGE_COLORS as readonly string[]).includes(data.tour.badgeColor ?? '')
                  ? (data.tour.badgeColor as (typeof BADGE_COLORS)[number])
                  : 'green',
                image: data.tour.coverImage ?? undefined,
                detailHref: `/tours/${data.tour.slug}`,
                bookHref: `/booking?tour=${data.tour.slug}`,
                t: data.tour.title,
                d: `${Math.max(data.tour.duration - 1, 0)}N / ${data.tour.duration}D`,
                places: data.tour.destinations.map((d) => d.destination.name).join(', '),
                r: data.tour.rating.toFixed(1),
                n: String(data.tour.reviewCount),
                old: data.tour.priceWas ? formatINR(data.tour.priceWas) : undefined,
                p: formatINR(data.tour.priceFrom),
              }}
            />
          )}
          {data.blog && <BlogSpotlightCard blog={data.blog} />}
        </>
      )}
    </aside>
  );
}
