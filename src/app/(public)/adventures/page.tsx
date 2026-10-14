// src/app/(public)/adventures/page.tsx
import { adventureStartingPrice } from "@/lib/adventureTiers";
import type { Metadata } from 'next';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import {
  JsonLd,
  buildBreadcrumbList,
  buildItemList,
} from '@/components/seo/JsonLd';
import { ListingHero } from '@/components/layout/ListingHero';
import { HeroLeadCard } from '@/components/leads/HeroLeadCard';
import { AdventuresPageClient } from '@/components/adventure/AdventuresPageClient';
import { TransportAssistanceBanner } from '@/components/tours/TransportAssistanceBanner';
import type { AdventureListItemData, AdventureTier } from '@/types/adventure';
import { getPublicHeroStats } from '@/lib/publicHeroStats';

// 24h safety net — Adventure mutations invalidate this page directly (src/lib/cache.ts).
export const revalidate = 86400;

function parse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getAdventuresHeroSection = cache(() =>
  prisma.homeSection.findUnique({ where: { key: 'adventuresHero' } }),
);

export async function generateMetadata(): Promise<Metadata> {
  const section = await getAdventuresHeroSection();
  return buildMetadata({
    title: section?.metaTitle || 'Kashmir Adventures & Seasonal Experiences',
    description:
      section?.metaDescription ||
      'Explore curated Kashmir adventures from Vertex Kashmir Holidays — limited-time seasonal experiences, group departures and themed itineraries with exclusive offers and easy EMI options.',
    canonical: `${SITE_URL}/adventures`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function AdventuresPage() {
  const [section, rows, stats] = await Promise.all([
    getAdventuresHeroSection(),
    prisma.adventure.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        sub: true,
        badge: true,
        heroImage: true,
        offerText: true,
        facts: true,
        tiers: true,
      },
    }),
    // Same live stat strip as the homepage, /tours and categories.
    getPublicHeroStats(),
  ]);

  const adventures: AdventureListItemData[] = rows.map((c) => {
    // Per person on 2-sharing — see adventureStartingPrice.
    const start = adventureStartingPrice(parse<AdventureTier[]>(c.tiers, []));
    const priceFrom = start.price;
    const priceWas = start.old;
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      sub: c.sub,
      badge: c.badge,
      image: c.heroImage,
      priceFrom,
      priceWas,
      offerText: c.offerText,
      facts: parse<string[]>(c.facts, []),
    };
  });

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: 'Home', url: SITE_URL },
    { name: 'Adventures', url: `${SITE_URL}/adventures` },
  ]);

  const adventuresJsonLd = buildItemList(
    adventures.map((c) => ({
      name: c.name,
      url: `${SITE_URL}/adventures/${c.slug}`,
    })),
    'Kashmir Adventures',
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {adventures.length > 0 && <JsonLd data={adventuresJsonLd} />}
      <ListingHero
        heading={{
          kicker: section?.kicker ?? null,
          title: section?.title ?? 'Kashmir Adventures & Seasonal Experiences',
          subtitle:
            section?.subtitle ??
            'Limited-time journeys, curated group departures and themed Kashmir itineraries — with exclusive offers and easy EMI options.',
          ctaLabel: section?.ctaLabel ?? null,
          ctaHref: section?.ctaHref ?? null,
        }}
        breadcrumbLabel="Adventures"
        heroImage={section?.heroImage ?? null}
        heroImageMobile={section?.heroImageMobile ?? null}
        defaultImage="/hero/pahalgam-lg.webp"
        defaultImageMobile="/hero/pahalgam.webp"
        alt="Kashmir adventure experiences"
        stats={stats}
        aside={
          <HeroLeadCard
            source="adventure"
            kicker={section?.formKicker ?? undefined}
            title={section?.formTitle ?? undefined}
            subtitle={section?.formSubtitle ?? undefined}
            buttonLabel={section?.formButtonLabel || 'Get Adventure Offers'}
          />
        }
      />
      <AdventuresPageClient adventures={adventures} />
      <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 sm:py-12">
        <TransportAssistanceBanner placement="adventures" />
      </div>
    </div>
  );
}
