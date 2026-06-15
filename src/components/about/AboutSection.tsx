'use client';

import Link from 'next/link';
import { renderAccents } from '@/lib/accents';
import type { AboutContentData, SectionHeading, SiteStatData } from '@/types/home';

interface AboutSectionProps {
  heading: SectionHeading;
  content: AboutContentData;
  stats: SiteStatData[];
}

export function AboutSection({ heading, content, stats }: AboutSectionProps) {
  return (
    <section id="about" className="relative z-[2] mx-auto max-w-[1300px] px-4 pt-16 sm:px-6 sm:pt-24">
      <div className="glass relative overflow-hidden rounded-[2rem] p-8 lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-green-bright/15 blur-3xl"></div>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="rv text-[11px] font-bold tracking-[0.22em] text-primary">{heading.kicker}</p>
            <h2 className="rv h-display mt-3 text-3xl sm:text-4xl font-bold text-foreground" style={{ '--rd': '0.08s' } as React.CSSProperties}>
              {renderAccents(heading.title)}
            </h2>
            {content.para1 && (
              <p className="rv mt-5 text-[15px] leading-relaxed text-muted-foreground" style={{ '--rd': '0.14s' } as React.CSSProperties}>
                {content.para1}
              </p>
            )}
            {content.para2 && (
              <p className="rv mt-4 text-[15px] leading-relaxed text-muted-foreground" style={{ '--rd': '0.2s' } as React.CSSProperties}>
                {content.para2}
              </p>
            )}
            {stats.length > 0 && (
              <div className="rv mt-7 grid grid-cols-3 gap-4" style={{ '--rd': '0.26s' } as React.CSSProperties}>
                {stats.map((stat, i) => (
                  <div key={i} className="glass rounded-2xl p-4 text-center">
                    <p className="text-lg sm:text-xl font-extrabold text-foreground">
                      {/^\d+$/.test(stat.value) ? Number(stat.value).toLocaleString('en-IN') : stat.value}
                      {stat.suffix}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
            {heading.ctaLabel && (
              <Link
                href={heading.ctaHref ?? '#'}
                className="rv mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:scale-[1.03]"
                style={{ '--rd': '0.32s' } as React.CSSProperties}
              >
                {heading.ctaLabel}
              </Link>
            )}
          </div>
          <div className="rv relative h-[420px]" style={{ '--rd': '0.18s' } as React.CSSProperties} data-depth-group>
            {content.image1 && (
              <img
                src={content.image1}
                alt={content.cardTitle ?? 'About us'}
                className="absolute left-0 top-6 h-[320px] w-[62%] rounded-3xl border border-border object-cover shadow-card"
                data-depth
                style={{ '--d': '0.6' } as React.CSSProperties}
              />
            )}
            {content.image2 && (
              <img
                src={content.image2}
                alt=""
                className="absolute bottom-0 right-0 h-[230px] w-[52%] rounded-3xl border border-border object-cover shadow-card"
                data-depth
                style={{ '--d': '1.1' } as React.CSSProperties}
              />
            )}
            {content.cardTitle && (
              <div className="glass-strong absolute right-4 top-2 rounded-2xl px-5 py-4 shadow-card" data-depth style={{ '--d': '1.6' } as React.CSSProperties}>
                {content.cardEmoji && <p className="text-2xl">{content.cardEmoji}</p>}
                <p className="mt-1 text-xs font-bold text-foreground">{content.cardTitle}</p>
                {content.cardSubtitle && <p className="text-[10px] text-muted-foreground">{content.cardSubtitle}</p>}
              </div>
            )}
            {content.ratingTitle && (
              <div className="glass-strong absolute -bottom-3 left-6 rounded-2xl px-5 py-4 shadow-card" data-depth style={{ '--d': '1.3' } as React.CSSProperties}>
                <p className="text-xs font-bold text-foreground">{content.ratingTitle}</p>
                {content.ratingSubtitle && <p className="text-[10px] text-muted-foreground">{content.ratingSubtitle}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
