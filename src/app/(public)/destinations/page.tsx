// src/app/(public)/destinations/page.tsx

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { DestinationsBrowser } from '@/components/destinations/DestinationsBrowser';
import { DestinationsCTABand } from '@/components/destinations/DestinationsCTABand';
import { DestinationsHero } from '@/components/destinations/DestinationsHero';
import { DestinationsThingsToDo } from '@/components/destinations/DestinationsThingsToDo';
import type { DestinationCardData } from '@/components/destinations/DestinationsGrid';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const section = await prisma.homeSection.findUnique({ where: { key: 'destinationsHero' } });
  return buildMetadata({
    title: 'Kashmir Destinations — Gulmarg, Pahalgam, Srinagar & More',
    description:
      'Explore the most beautiful destinations in Kashmir & Ladakh with Vertex Kashmir Holidays — meadows, lakes, glaciers and high passes, with curated tour packages for each.',
    canonical: `${SITE_URL}/destinations`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function DestinationsPage() {
  const [section, destinations] = await Promise.all([
    prisma.homeSection.findUnique({ where: { key: 'destinationsHero' } }),
    prisma.destination.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        slug: true,
        name: true,
        tagline: true,
        excerpt: true,
        description: true,
        coverImage: true,
        altitude: true,
        season: true,
        region: true,
        location: true,
        _count: { select: { tours: { where: { tour: { published: true } } } } },
      },
    }),
  ]);

  const cards: DestinationCardData[] = destinations.map((d) => ({
    slug: d.slug,
    name: d.name,
    tagline: d.tagline,
    description: d.excerpt ?? d.description,
    coverImage: d.coverImage,
    altitude: d.altitude,
    season: d.season,
    region: d.region ?? (/ladakh/i.test(d.location ?? '') ? 'Ladakh' : 'Kashmir Valley'),
    tours: d._count.tours,
  }));

  return (
    <div className="bg-background text-foreground">
      <DestinationsHero
        heroImage={section?.heroImage ?? null}
        heroImageMobile={section?.heroImageMobile ?? null}
      />
      <DestinationsBrowser destinations={cards} />
      <DestinationsCTABand />
      <DestinationsThingsToDo />
    </div>
  );
}
