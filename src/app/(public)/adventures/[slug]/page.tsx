// src/app/(public)/adventures/[slug]/page.tsx

import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSiteSettings, buildFooterSettings } from '@/lib/siteSettings';
import { getActiveCorporateOffices } from '@/lib/companyOffice';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { AdventurePageClient } from '@/components/adventure/AdventurePageClient';
import { JsonLd, buildBreadcrumbList, buildAdventureProduct, buildDepartureEvents, buildFAQPage } from '@/components/seo/JsonLd';
import { getDisplayReviews } from '@/lib/reviews';
import { sanitizeInlineHtml } from '@/lib/sanitize';
import type {
  AdventureActivity,
  AdventureBatch,
  AdventureData,
  AdventureHighlight,
  AdventureItineraryItem,
  AdventureTestimonial,
  AdventureTier,
} from '@/types/adventure';
import { FAQ_PREVIEW_SELECT, toFaqPreview } from "@/lib/faqs";

// 24h safety net — Adventure mutations invalidate this exact page directly (src/lib/cache.ts).
export const revalidate = 86400;

type PageProps = { params: Promise<{ slug: string }> };

function parse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// Pre-render every published adventure at build time, matching every other
// detail route (tours/destinations/activities/blog/careers) — previously
// missing here, so these pages were only ever built on-demand at first visit.
export async function generateStaticParams() {
  const adventures = await prisma.adventure.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return adventures.map((c) => ({ slug: c.slug }));
}

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getAdventure = cache(async (slug: string) =>
  prisma.adventure.findUnique({
    where: { slug },
    include: {
      relatedFaqs: {
        where: { status: 'PUBLISHED' },
        orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
        select: FAQ_PREVIEW_SELECT,
      },
    },
  }),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = await getAdventure(slug);
  if (!c || !c.published) {
    return buildMetadata({
      title: 'Adventure Not Found',
      description: 'This adventure could not be found.',
      canonical: `${SITE_URL}/adventures/${slug}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: c.metaTitle ?? c.name,
    description:
      c.metaDesc ??
      `${c.sub ? `${c.sub} ` : ""}${c.name} — a curated Kashmir experience by Vertex Kashmir Holidays.`,
    canonical: `${SITE_URL}/adventures/${slug}`,
    ogImage: c.ogImage ?? c.heroImage ?? null,
  });
}

export default async function AdventurePage({ params }: PageProps) {
  const { slug } = await params;
  const [c, s, reviews, corporateOffices] = await Promise.all([
    getAdventure(slug),
    getSiteSettings(),
    getDisplayReviews(6),
    getActiveCorporateOffices(),
  ]);
  if (!c || !c.published) notFound();

  const footerSettings = buildFooterSettings(s);
  const corporateOffice = corporateOffices[0]
    ? { name: corporateOffices[0].name, address: corporateOffices[0].address }
    : null;

  // Adventure "traveller stories" now pull from the global Review module rather
  // than a per-adventure JSON field — reviews are admin/customer managed.
  const testimonials: AdventureTestimonial[] = reviews.map((r) => ({
    image: r.avatar ?? '',
    name: r.name,
    location: r.location ?? '',
    quote: r.quote,
  }));

  const data: AdventureData = {
    slug: c.slug,
    accent: c.accent,
    accent2: c.accent2,
    particles: c.particles === 'embers' ? 'embers' : 'snow',
    name: c.name,
    badge: c.badge,
    titleHtml: sanitizeInlineHtml(c.titleHtml),
    sub: c.sub,
    heroImage: c.heroImage,
    heroImageMobile: c.heroImageMobile,
    finalImage: c.finalImage,
    facts: parse<string[]>(c.facts, []),
    heroCta: c.heroCta,
    proofCount: c.proofCount,
    formCta: c.formCta,
    pricingKicker: c.pricingKicker,
    pricingTitle: c.pricingTitle,
    paymentNote: c.paymentNote,
    offerText: c.offerText,
    offerDeadline: c.offerDeadline ? c.offerDeadline.toISOString() : null,
    offerSeats: c.offerSeats,
    navCta: c.navCta,
    phone: c.phone,
    whatsappHref: c.whatsappHref,
    strip: parse<string[]>(c.strip, []),
    stats: parse<Array<[string, string, string]>>(c.stats, []),
    filmTitle: c.filmTitle,
    filmDuration: c.filmDuration,
    filmPoster: c.filmPoster,
    filmSrc: c.filmSrc,
    highlightsTitle: c.highlightsTitle,
    highlights: parse<AdventureHighlight[]>(c.highlights, []),
    activitiesTitle: c.activitiesTitle,
    activities: parse<AdventureActivity[]>(c.activities, []),
    itineraryTitle: c.itineraryTitle,
    itinerary: parse<AdventureItineraryItem[]>(c.itinerary, []),
    tiers: parse<AdventureTier[]>(c.tiers, []),
    batches: parse<AdventureBatch[]>(c.batches, []),
    inclusions: parse<string[]>(c.inclusions, []),
    exclusions: parse<string[]>(c.exclusions, []),
    galleryTitle: sanitizeInlineHtml(c.galleryTitle),
    gallery: parse<string[]>(c.gallery, []),
    testimonials,
    faqsTitle: sanitizeInlineHtml(c.faqsTitle),
    faqs: c.relatedFaqs.map(toFaqPreview),
    finalTitle: c.finalTitle,
    finalSub: c.finalSub,
    finalCta: c.finalCta,
    finalNote: c.finalNote,
  };

  const breadcrumbLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: data.name, url: `${SITE_URL}/adventures/${data.slug}` },
  ]);
  const productLd = buildAdventureProduct({
    name: data.name,
    slug: data.slug,
    sub: data.sub,
    heroImage: data.heroImage,
    tiers: data.tiers,
    offerDeadline: data.offerDeadline,
  });
  const eventLds = buildDepartureEvents({
    name: data.name,
    slug: data.slug,
    heroImage: data.heroImage,
    batches: data.batches,
  });

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={productLd} />
      {eventLds.map((ev, i) => <JsonLd key={i} data={ev} />)}
      {data.faqs.length > 0 && <JsonLd data={buildFAQPage(data.faqs.map((f) => ({ question: f.question, answer: f.shortAnswer })))} />}
      <AdventurePageClient adventure={data} footerSettings={footerSettings} corporateOffice={corporateOffice} />
    </>
  );
}
