"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { renderAccents } from "@/lib/accents";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroStats } from "@/components/layout/HeroStats";
import type { SectionHeading, SiteStatData } from "@/types/home";

interface ListingHeroProps {
  /** kicker/title/subtitle/ctaLabel/ctaHref — each rendered only when set (see below). */
  heading: SectionHeading;
  breadcrumbLabel: string;
  stats?: SiteStatData[];
  heroImage?: string | null;
  heroImageMobile?: string | null;
  defaultImage: string;
  defaultImageMobile: string;
  alt: string;
  aside: ReactNode;
}

/**
 * Shared hero for every listing page (Tours, Activities, Adventures) built on
 * a CMS-editable HomeSection row: breadcrumb + optional kicker + title +
 * optional subtitle + optional stats + optional CTA button. Each optional
 * field renders only when the admin has actually set it — never a
 * placeholder. This replaced three near-identical, drifting copies
 * (ToursHeroSection, CampaignsHeroSection, and Activities' inline JSX), the
 * last of which silently dropped kicker/CTA entirely.
 *
 * Destinations keeps its own bespoke hero (badges instead of stats) — not
 * migrated here — but reads the same `heading` shape for consistency.
 */
export function ListingHero({
  heading,
  breadcrumbLabel,
  stats = [],
  heroImage,
  heroImageMobile,
  defaultImage,
  defaultImageMobile,
  alt,
  aside,
}: ListingHeroProps) {
  const isExternal = !!heading.ctaHref && /^https?:\/\//.test(heading.ctaHref);

  return (
    <SecondaryHero
      image={heroImage ?? defaultImage}
      imageMobile={heroImageMobile ?? defaultImageMobile}
      alt={alt}
      aside={aside}
    >
      <nav className="flex items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-white">
          Home
        </Link>
        <span>›</span>
        <span className="font-semibold text-white">{breadcrumbLabel}</span>
      </nav>

      <div className="mt-6">
        {heading.kicker && (
          <p
            className="hero-reveal text-[12px] font-bold tracking-[0.22em] text-primary"
            style={{ "--hr-delay": "0.05s" } as React.CSSProperties}
          >
            {heading.kicker}
          </p>
        )}
        <h1
          className="hero-reveal h-display mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
          style={{ "--hr-y": "20px", "--hr-delay": "0.1s" } as React.CSSProperties}
        >
          {renderAccents(heading.title)}
        </h1>
        {heading.subtitle && (
          <p
            className="hero-reveal mt-3 text-[16px] text-white/85"
            style={{ "--hr-delay": "0.2s" } as React.CSSProperties}
          >
            {heading.subtitle}
          </p>
        )}
      </div>

      <HeroStats stats={stats} />

      {heading.ctaLabel && heading.ctaHref && (
        <div className="hero-reveal mt-6" style={{ "--hr-delay": "0.3s" } as React.CSSProperties}>
          <Link
            href={heading.ctaHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
          >
            {heading.ctaLabel}
          </Link>
        </div>
      )}
    </SecondaryHero>
  );
}
