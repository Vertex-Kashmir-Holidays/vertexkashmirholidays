"use client";

import Link from "next/link";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { TripPlannerForm } from "@/components/leads/TripPlannerForm";

interface CityOriginHeroProps {
  /** Display heading text — may include a parenthetical aka (e.g. "Bengaluru
   *  (Bangalore)"). Used only for copy, never sent to the form. */
  cityName: string;
  /** Clean city name (no parenthetical) — prefills the Trip Planner form's
   *  "Travelling from" field. Falls back to `cityName` if not given. */
  originCity?: string;
}

// Same SecondaryHero shell used by every other listing page (Tours,
// Destinations, Categories) — kept identical so these origin-city SEO pages
// read as a natural part of the site, not a bolted-on template built only to
// rank for a keyword. The aside is the same TripPlannerForm the standalone
// /plan-your-kashmir-trip page uses (source="tour-origin-city" so these leads
// keep reporting under this page's own tag), with the origin pre-filled —
// one form, one lead pipeline, not a separate one per page.
export function CityOriginHero({ cityName, originCity }: CityOriginHeroProps) {
  return (
    <SecondaryHero
      image="/hero/gulmarg-lg.webp"
      imageMobile="/hero/gulmarg.webp"
      alt="Kashmir valley"
      // Same desktop content/form split as /plan-your-kashmir-trip (both use
      // the same TripPlannerForm as their primary CTA) — keep these two in
      // sync if either one's split changes.
      contentWidth="0.85fr"
      asideWidth="minmax(0,560px)"
      asideMaxWidthClass="max-w-xl"
      aside={
        <TripPlannerForm
          source="tour-origin-city"
          defaultFromCity={originCity ?? cityName}
          className="max-w-xl"
        />
      }
    >
      <nav
        className="flex flex-wrap items-center gap-2 text-[14px] text-white/80"
        aria-label="Breadcrumb"
      >
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
