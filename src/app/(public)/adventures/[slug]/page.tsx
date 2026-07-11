// src/app/(public)/campaign/[slug]/page.tsx

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { buildMetadata, SITE_URL } from '@/lib/seo';
import { CampaignPageClient } from '@/components/campaign/CampaignPageClient';
import { JsonLd, buildBreadcrumbList, buildCampaignProduct, buildCampaignEvents, buildFAQPage } from '@/components/seo/JsonLd';
import { getDisplayReviews } from '@/lib/reviews';
import type { FooterSettings } from '@/components/layout/Footer';
import { sanitizeInlineHtml } from '@/lib/sanitize';
import type {
  CampaignActivity,
  CampaignBatch,
  CampaignData,
  CampaignHighlight,
  CampaignItineraryItem,
  CampaignTestimonial,
  CampaignTier,
} from '@/types/campaign';

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

function parse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = await prisma.campaign.findUnique({
    where: { slug },
    select: { name: true, sub: true, metaTitle: true, metaDesc: true, ogImage: true, heroImage: true, published: true },
  });
  if (!c || !c.published) {
    return buildMetadata({
      title: 'Campaign Not Found',
      description: 'This campaign could not be found.',
      canonical: `${SITE_URL}/campaign/${slug}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: c.metaTitle ?? c.name,
    description: c.metaDesc ?? c.sub ?? `${c.name} — a curated Kashmir experience by Vertex Kashmir Holidays.`,
    canonical: `${SITE_URL}/campaign/${slug}`,
    ogImage: c.ogImage ?? c.heroImage ?? null,
  });
}

export default async function CampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const [c, s, reviews] = await Promise.all([
    prisma.campaign.findUnique({
      where: { slug },
      include: {
        relatedFaqs: {
          where: { status: 'PUBLISHED' },
          orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
          select: { id: true, question: true, shortAnswer: true, slug: true },
        },
      },
    }),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    getDisplayReviews(6),
  ]);
  if (!c || !c.published) notFound();

  const footerSettings: FooterSettings | null = s
    ? {
        siteName: s.siteName,
        siteTagline: s.siteTagline,
        siteEmail: s.siteEmail,
        sitePhone: s.sitePhone,
        siteAddress: s.siteAddress,
        whatsapp: s.whatsapp,
        facebook: s.facebook,
        instagram: s.instagram,
        twitter: s.twitter,
        youtube: s.youtube,
        googleReviews: s.googleReviews,
        tripadvisor: s.tripadvisor,
      }
    : null;

  // Campaign "traveller stories" now pull from the global Review module rather
  // than a per-campaign JSON field — reviews are admin/customer managed.
  const testimonials: CampaignTestimonial[] = reviews.map((r) => ({
    image: r.avatar ?? '',
    name: r.name,
    location: r.location ?? '',
    quote: r.quote,
  }));

  const data: CampaignData = {
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
    highlights: parse<CampaignHighlight[]>(c.highlights, []),
    activitiesTitle: c.activitiesTitle,
    activities: parse<CampaignActivity[]>(c.activities, []),
    itineraryTitle: c.itineraryTitle,
    itinerary: parse<CampaignItineraryItem[]>(c.itinerary, []),
    tiers: parse<CampaignTier[]>(c.tiers, []),
    batches: parse<CampaignBatch[]>(c.batches, []),
    inclusions: parse<string[]>(c.inclusions, []),
    exclusions: parse<string[]>(c.exclusions, []),
    galleryTitle: sanitizeInlineHtml(c.galleryTitle),
    gallery: parse<string[]>(c.gallery, []),
    testimonials,
    faqsTitle: sanitizeInlineHtml(c.faqsTitle),
    faqs: c.relatedFaqs,
    finalTitle: c.finalTitle,
    finalSub: c.finalSub,
    finalCta: c.finalCta,
    finalNote: c.finalNote,
  };

  const breadcrumbLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: data.name, url: `${SITE_URL}/campaign/${data.slug}` },
  ]);
  const productLd = buildCampaignProduct({
    name: data.name,
    slug: data.slug,
    sub: data.sub,
    heroImage: data.heroImage,
    tiers: data.tiers,
    offerDeadline: data.offerDeadline,
  });
  const eventLds = buildCampaignEvents({
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
      <CampaignPageClient campaign={data} footerSettings={footerSettings} />
    </>
  );
}
