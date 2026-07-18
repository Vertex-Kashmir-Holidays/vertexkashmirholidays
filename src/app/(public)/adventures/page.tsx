// src/app/(public)/campaign/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList, buildItemList } from "@/components/seo/JsonLd";
import { CampaignsHeroSection } from "@/components/campaign/CampaignsHeroSection";
import { CampaignsPageClient } from "@/components/campaign/CampaignsPageClient";
import type { CampaignListItemData, CampaignTier } from "@/types/campaign";

export const revalidate = 300;

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
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

// Cheapest tier drives the "from" price; its `old` (if higher) becomes the strike price.
function priceFromTiers(tiers: CampaignTier[]): {
  priceFrom: number | null;
  priceWas: number | null;
} {
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

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Kashmir Campaigns & Seasonal Experiences",
    description:
      "Explore curated Kashmir campaigns from Vertex Kashmir Holidays — limited-time seasonal experiences, group departures and themed itineraries with exclusive offers and easy EMI options.",
    canonical: `${SITE_URL}/campaign`,
  });
}

export default async function CampaignsPage() {
  const [rows, stats] = await Promise.all([
    prisma.campaign.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
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
    prisma.siteStat.findMany({ where: { section: "hero" }, orderBy: { sortOrder: "asc" } }),
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
    { name: "Home", url: SITE_URL },
    { name: "Campaigns", url: `${SITE_URL}/campaign` },
  ]);

  const campaignsJsonLd = buildItemList(
    campaigns.map((c) => ({
      name: c.name,
      url: `${SITE_URL}/campaign/${c.slug}`,
    })),
    "Kashmir Campaigns",
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {campaigns.length > 0 && <JsonLd data={campaignsJsonLd} />}
      <CampaignsHeroSection
        title="Kashmir Campaigns & Seasonal Experiences"
        subtitle="Limited-time journeys, curated group departures and themed Kashmir itineraries — with exclusive offers and easy EMI options."
        stats={stats.map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }))}
      />
      <CampaignsPageClient campaigns={campaigns} />
    </div>
  );
}
