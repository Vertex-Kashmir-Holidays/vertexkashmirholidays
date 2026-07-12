// src/components/reviews/ReviewsHero.tsx
'use client';

import type { ReactNode } from 'react';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';

interface ReviewsHeroData {
  breadcrumb: string | null;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  imageMobile: string | null;
}

interface ReviewsHeroProps {
  data: ReviewsHeroData;
  /** Trust badges (Google rating, Tripadvisor award widget) shown below the subtitle. */
  badges?: ReactNode;
}

export function ReviewsHero({ data, badges }: ReviewsHeroProps) {
  return (
    <SecondaryHero
      image={data.image}
      imageMobile={data.imageMobile}
      alt="Happy travellers on a Kashmir houseboat"
      aside={<HeroLeadCard source="reviews" />}
    >
      <nav className="flex items-center gap-2 text-[14px] text-white/85" aria-label="Breadcrumb">
        <a href="/" className="transition hover:text-white">Home</a>
        <span>›</span>
        <span className="font-semibold text-white">{data.breadcrumb}</span>
      </nav>
      <h1
        className="hero-reveal h-display mt-6 font-display text-3xl font-bold leading-[1.12] text-white sm:text-4xl lg:text-[48px]"
        style={{ '--hr-y': '30px', '--hr-delay': '0.1s' } as React.CSSProperties}
      >
        {data.title}
      </h1>
      {data.subtitle && (
        <p
          className="hero-reveal mt-5 max-w-md text-[16px] leading-relaxed text-white/85"
          style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
        >
          {data.subtitle}
        </p>
      )}
      {badges && (
        <div
          className="hero-reveal mt-6 flex flex-wrap items-center gap-3"
          style={{ '--hr-delay': '0.3s' } as React.CSSProperties}
        >
          {badges}
        </div>
      )}
    </SecondaryHero>
  );
}
