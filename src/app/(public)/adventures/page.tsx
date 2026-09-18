// src/app/(public)/adventures/page.tsx
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
import { CampaignsPageClient } from '@/components/campaign/CampaignsPageClient';
import { TransportAssistanceBanner } from '@/components/tours/TransportAssistanceBanner';
import type { CampaignListItemData, CampaignTier } from '@/types/campaign';

// 24h safety net — Campaign mutations invalidate this page directly (src/lib/cache.ts).
export const revalidate = 86400;

function parse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// Campaign tier prices are stored as display strings (e.g. "₹24,999"); pull the
// first run of digits so we can sort/compare and drive the EMI estimate.
function toNumber(price: string | null | undefined): number | null {
  if (!price) return null;
  const digits = price.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

// Cheapest tier drives the "from" price; its `old` (if higher) becomes the strike price.
function priceFromTiers(tiers: CampaignTier[]): { priceFrom: number | null; priceWas: number | null } {
  let best: { priceFrom: number; priceWas: number | null } | null = null;
  for (const tier of tiers) {
    const p = toNumber(tier.price);
    if (p == null) continue;
    if (!best || p < best.priceFrom) {
      best = { priceFrom: p, priceWas: toNumber(tier.old) };
    }
  }
  return best ?? { priceFrom: null, priceWas: null };
}

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getAdventuresHeroSection = cache(() =>
  prisma.homeSection.findUnique({ where: { key: 'adventuresHero' } }),
);

export async function generateMetadata(): Promise<Metadata> {
  const section = await getAdventuresHeroSection();
  return buildMetadata({
    title: section?.metaTitle || 'Kashmir Campaigns & Seasonal Experiences',
    description:
      section?.metaDescription ||
      'Explore curated Kashmir campaigns from Vertex Kashmir Holidays — limited-time seasonal experiences, group departures and themed itineraries with exclusive offers and easy EMI options.',
    canonical: `${SITE_URL}/adventures`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function CampaignsPage() {
  const [section, rows, stats] = await Promise.all([
    getAdventuresHeroSection(),
    prisma.campaign.findMany({
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
    prisma.siteStat.findMany({ where: { section: 'hero' }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const campaigns: CampaignListItemData[] = rows.map((c) => {
    const { priceFrom, priceWas } = priceFromTiers(parse<CampaignTier[]>(c.tiers, []));
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
    { name: 'Campaigns', url: `${SITE_URL}/adventures` },
  ]);

  const campaignsJsonLd = buildItemList(
    campaigns.map((c) => ({
      name: c.name,
      url: `${SITE_URL}/adventures/${c.slug}`,
    })),
    'Kashmir Campaigns',
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {campaigns.length > 0 && <JsonLd data={campaignsJsonLd} />}
      <ListingHero
        heading={{
          kicker: section?.kicker ?? null,
          title: section?.title ?? 'Kashmir Campaigns & Seasonal Experiences',
          subtitle:
            section?.subtitle ??
            'Limited-time journeys, curated group departures and themed Kashmir itineraries — with exclusive offers and easy EMI options.',
          ctaLabel: section?.ctaLabel ?? null,
          ctaHref: section?.ctaHref ?? null,
        }}
        breadcrumbLabel="Campaigns"
        heroImage={section?.heroImage ?? null}
        heroImageMobile={section?.heroImageMobile ?? null}
        defaultImage="/hero/pahalgam-lg.webp"
        defaultImageMobile="/hero/pahalgam.webp"
        alt="Kashmir campaign experiences"
        stats={stats.map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }))}
        aside={<HeroLeadCard source="campaign" buttonLabel="Get Campaign Offers" />}
      />
      <CampaignsPageClient campaigns={campaigns} />
      <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 sm:py-12">
        <TransportAssistanceBanner placement="adventures" />
      </div>
    </div>
  );
}
