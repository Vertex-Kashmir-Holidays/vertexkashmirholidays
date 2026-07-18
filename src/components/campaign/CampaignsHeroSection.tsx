"use client";

import Link from "next/link";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import { HeroStats } from "@/components/layout/HeroStats";
import type { SiteStatData } from "@/types/home";

interface CampaignsHeroSectionProps {
  title: string;
  subtitle: string;
  stats: SiteStatData[];
}

export function CampaignsHeroSection({ title, subtitle, stats }: CampaignsHeroSectionProps) {
  return (
    <SecondaryHero
      image="/hero/pahalgam-lg.webp"
      imageMobile="/hero/pahalgam.webp"
      alt="Kashmir campaign experiences"
      aside={<HeroLeadCard source="campaign" buttonLabel="Get Campaign Offers" />}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-white">
          Home
        </Link>
        <span>›</span>
        <span className="text-white/60">Campaigns</span>
      </nav>

      {/* Title Block */}
      <div className="mt-6">
        <h1
          className="hero-reveal h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
          style={{ "--hr-y": "20px", "--hr-delay": "0.1s" } as React.CSSProperties}
        >
          {title}
        </h1>
        <p
          className="hero-reveal mt-3 max-w-xl text-[16px] text-white/85"
          style={{ "--hr-delay": "0.2s" } as React.CSSProperties}
        >
          {subtitle}
        </p>
      </div>

      {/* Stats */}
      <HeroStats stats={stats} />
    </SecondaryHero>
  );
}
