"use client";

import Link from "next/link";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";

interface CityOriginHeroProps {
  cityName: string;
}

// Same SecondaryHero + breadcrumb + HeroLeadCard shell used by every other
// listing page (Tours, Destinations, Categories) — kept identical so these
// origin-city SEO pages read as a natural part of the site, not a bolted-on
// template built only to rank for a keyword.
export function CityOriginHero({ cityName }: CityOriginHeroProps) {
  return (
    <SecondaryHero
      image="/hero/gulmarg-lg.webp"
      imageMobile="/hero/gulmarg.webp"
      alt="Kashmir valley"
      aside={
        <HeroLeadCard
          source="tour-origin-city"
          title="Get a free quote in 60 seconds"
          subtitle="Free, no spam — a real human replies on WhatsApp."
          buttonLabel="Get a Free Quote"
        />
      }
    >
      <nav className="flex flex-wrap items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-white">
          Home
        </Link>
        <span>›</span>
        <Link href="/tours" className="transition hover:text-white">
          Tours
        </Link>
        <span>›</span>
        <span className="font-semibold text-white">Kashmir Tour Packages from {cityName}</span>
      </nav>

      <div className="mt-6">
        <h1
          className="hero-reveal h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
          style={{ "--hr-y": "20px", "--hr-delay": "0.1s" } as React.CSSProperties}
        >
          Kashmir Tour Packages from {cityName}
        </h1>
        <p
          className="hero-reveal mt-3 max-w-md text-[16px] text-white/85"
          style={{ "--hr-delay": "0.2s" } as React.CSSProperties}
        >
          Handpicked Kashmir holidays, curated by local experts — and if you need it, we can also
          arrange your flight or train tickets from {cityName}.
        </p>
      </div>
    </SecondaryHero>
  );
}
