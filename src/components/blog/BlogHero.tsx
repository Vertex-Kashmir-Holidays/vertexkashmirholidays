// src/components/blog/BlogHero.tsx
'use client';

import { Search } from 'lucide-react';
import { SecondaryHero } from '@/components/layout/SecondaryHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import type { BlogPageContent } from '@/types/blog';

interface BlogHeroProps {
  content: BlogPageContent;
  onSearch: (query: string) => void;
}

export function BlogHero({ content, onSearch }: BlogHeroProps) {
  return (
    <SecondaryHero
      image={content.heroImage}
      imageMobile={content.heroImageMobile}
      alt="Houseboats on a Kashmir lake"
      aside={<HeroLeadCard source="blog-list" />}
    >
        <p
          className="hero-reveal text-[14px] font-bold tracking-[0.32em] text-white/90"
          style={{ '--hr-y': '20px', '--hr-duration': '0.5s' } as React.CSSProperties}
        >
          {content.heroKicker}
        </p>
        <h1
          className="hero-reveal mt-4 text-3xl font-bold leading-tight text-white sm:text-[38px] lg:text-[42px]"
          style={{ '--hr-y': '30px', '--hr-delay': '0.1s' } as React.CSSProperties}
        >
          {content.heroTitle}
        </h1>
        <p
          className="hero-reveal mt-3 text-[16px] text-white/90"
          style={{ '--hr-delay': '0.2s' } as React.CSSProperties}
        >
          {content.heroSubtitle}
        </p>
        <label
          className="hero-reveal mt-7 flex w-full max-w-[350px] items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-card"
          style={{ '--hr-y': '20px', '--hr-delay': '0.3s' } as React.CSSProperties}
        >
          <input
            id="blogSearch"
            className="w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            placeholder={content.heroSearchPlaceholder ?? 'Search articles...'}
            onChange={(e) => onSearch(e.target.value)}
          />
          <Search className="h-4 w-4 shrink-0 text-foreground/70" strokeWidth={2} />
        </label>
    </SecondaryHero>
  );
}
