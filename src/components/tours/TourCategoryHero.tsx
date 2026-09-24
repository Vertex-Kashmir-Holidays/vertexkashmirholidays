"use client";

import Link from "next/link";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import { HeroStats } from "@/components/layout/HeroStats";
import { HeroWhatsAppCta } from "@/components/leads/HeroWhatsAppCta";
import type { SiteStatData } from "@/types/home";

interface TourCategoryHeroProps {
  pageTitle: string;
  subtitle: string;
  heroImage?: string | null;
  heroImageMobile?: string | null;
  // Optional CTA rendered under the subtitle — omitted by every existing
  // per-category page; only the /tours/category hub passes this.
  ctaLabel?: string;
  ctaHref?: string;
  // Same shared, genuinely live-computed stats as /tours and
  // /plan-your-kashmir-trip (see src/lib/publicHeroStats.ts) — omitted
  // (no strip rendered) on the /tours/category hub, which doesn't pass it.
  stats?: SiteStatData[];
  // WhatsApp message + analytics sourcePage — per-category, so omitted (no
  // CTA rendered) on the hub page, which doesn't pass it.
  whatsappMessage?: string;
  sourcePage?: string;
}

// Same SecondaryHero + breadcrumb + HeroLeadCard shell used by every other
// listing page (Tours, Destinations, Blog, Contact) — kept identical so
// category pages read as a natural part of the site, not a bolted-on template.
export function TourCategoryHero({
  pageTitle,
  subtitle,
  heroImage,
  heroImageMobile,
  ctaLabel,
  ctaHref,
  stats,
  whatsappMessage,
  sourcePage,
}: TourCategoryHeroProps) {
  return (
    <SecondaryHero
      image={heroImage ?? "/hero/gulmarg-lg.webp"}
      imageMobile={heroImageMobile ?? "/hero/gulmarg.webp"}
      alt="Kashmir valley"
      aside={<HeroLeadCard source="tour-category" buttonLabel="Get a Free Quote" />}
    >
      <nav className="flex items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-white">
          Home
        </Link>
        <span>›</span>
        <Link href="/tours" className="transition hover:text-white">
          Tours
        </Link>
        <span>›</span>
        <span className="font-semibold text-white">{pageTitle}</span>
      </nav>

      <div className="mt-6">
        <h1
          className="hero-reveal h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
          style={{ "--hr-y": "20px", "--hr-delay": "0.1s" } as React.CSSProperties}
        >
          {pageTitle}
        </h1>
        <p
          className="hero-reveal mt-3 max-w-md text-[16px] text-white/85"
          style={{ "--hr-delay": "0.2s" } as React.CSSProperties}
        >
          {subtitle}
        </p>
        {ctaLabel && ctaHref && (
          <div className="hero-reveal mt-6" style={{ "--hr-delay": "0.3s" } as React.CSSProperties}>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[14px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
        {stats && <HeroStats stats={stats} />}
        {whatsappMessage && sourcePage && (
          <HeroWhatsAppCta
            message={whatsappMessage}
            source="tour_category_hero"
            sourcePage={sourcePage}
          />
        )}
      </div>
    </SecondaryHero>
  );
}
