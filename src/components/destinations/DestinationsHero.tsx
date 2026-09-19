// src/components/destinations/DestinationsHero.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, Compass, BadgeIndianRupee, type LucideIcon } from "lucide-react";
import { renderAccents } from "@/lib/accents";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import type { SectionHeading } from "@/types/home";

const badges: { t: string; s: string; Icon: LucideIcon }[] = [
  { t: "Handpicked", s: "by local experts", Icon: Sparkles },
  { t: "Real Experiences", s: "not tourist traps", Icon: Compass },
  { t: "Best Price", s: "guaranteed", Icon: BadgeIndianRupee },
];

interface DestinationsHeroProps {
  heading: SectionHeading;
  /** Lead-capture card copy — separate from `heading` (the H1), same
   * kicker/title/subtitle/buttonLabel-distinct-from-heading pattern used
   * elsewhere. Undefined fields fall through to HeroLeadCard's own defaults. */
  formSetting?: {
    kicker?: string | null;
    title?: string | null;
    subtitle?: string | null;
    buttonLabel?: string | null;
  };
  heroImage?: string | null;
  heroImageMobile?: string | null;
}

export function DestinationsHero({
  heading,
  formSetting,
  heroImage,
  heroImageMobile,
}: DestinationsHeroProps) {
  const isExternal = !!heading.ctaHref && /^https?:\/\//.test(heading.ctaHref);

  return (
    <SecondaryHero
      image={heroImage ?? "/hero/srinagar-lg.webp"}
      imageMobile={heroImageMobile ?? "/hero/srinagar.webp"}
      alt="Dal Lake, Kashmir"
      aside={
        <HeroLeadCard
          source="destinations"
          kicker={formSetting?.kicker ?? undefined}
          title={formSetting?.title ?? undefined}
          subtitle={formSetting?.subtitle ?? undefined}
          buttonLabel={formSetting?.buttonLabel ?? undefined}
        />
      }
    >
      <nav className="flex items-center gap-2 text-[14px] text-white/85" aria-label="Breadcrumb">
        <a href="/" className="transition hover:text-white">
          Home
        </a>
        <span>›</span>
        <span className="font-semibold text-white">Destinations</span>
      </nav>

      {heading.kicker && (
        <p
          className="hero-reveal mt-7 text-[12px] font-bold tracking-[0.22em] text-primary"
        >
          {heading.kicker}
        </p>
      )}
      <h1
        className={`hero-reveal max-w-xl text-4xl font-bold leading-[1.15] text-white lg:text-[42px] ${heading.kicker ? "mt-2" : "mt-7"}`}
        style={{ "--hr-y": "20px" } as React.CSSProperties}
      >
        {renderAccents(heading.title)}
      </h1>
      {heading.subtitle && (
        <p
          className="hero-reveal mt-5 max-w-md text-[16px] leading-relaxed text-white/85"
          style={{ "--hr-delay": "0.1s" } as React.CSSProperties}
        >
          {heading.subtitle}
        </p>
      )}

      {heading.ctaLabel && heading.ctaHref && (
        <div className="hero-reveal mt-5" style={{ "--hr-delay": "0.15s" } as React.CSSProperties}>
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

      <motion.div
        className="mt-8 flex flex-wrap gap-3.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {badges.map(({ t, s, Icon }) => (
          <div
            key={t}
            className="flex items-center gap-3 rounded-xl border border-white/25 bg-black/35 px-4 py-2.5 backdrop-blur"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/30 text-white">
              <Icon className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <span className="leading-tight">
              <span className="block text-[14px] font-bold text-white">{t}</span>
              <span className="block text-[12px] text-white/70">{s}</span>
            </span>
          </div>
        ))}
      </motion.div>
    </SecondaryHero>
  );
}
