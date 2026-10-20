// src/app/(public)/tours/category/[category]/page.tsx
import { effectiveFormMode, publicPriceFields, tourCardPricing } from "@/lib/tours/cards";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { KASHMIR_SITE_REGIONS } from "@/lib/tours/regions";
import { compareToursForCards } from "@/lib/tours/ordering";
import { getSiteSettings } from "@/lib/siteSettings";
import { getPublicHeroStats } from "@/lib/publicHeroStats";
import {
  JsonLd,
  buildBreadcrumbList,
  buildCollectionPage,
  buildItemList,
} from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { TOUR_CATEGORY_META, getCategoryBySlug } from "@/lib/tours/categories";
import { TourCategoryHero } from "@/components/tours/TourCategoryHero";
import { TourCategoryFeatured } from "@/components/tours/TourCategoryFeatured";
import { TourCategoryRecommended } from "@/components/tours/TourCategoryRecommended";
import { AffordabilityWidget } from "@/components/payments/AffordabilityWidget";
import { TourDetailsSidebar } from "@/components/tours/TourDetailsSidebar";
import { TrustSection } from "@/components/common/TrustSection";
import type { TourCategory } from "@prisma/client";

// 24h safety net — Tour mutations invalidate the matching category page directly
// (both old and new category, if a tour's category changed — src/lib/cache.ts).
export const revalidate = 86400;

const BADGE_COLORS = ["orange", "blue", "green"] as const;

type PageProps = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  const categories = await prisma.tour.groupBy({
    by: ["category"],
    where: { published: true, region: { in: KASHMIR_SITE_REGIONS } },
    _count: true,
  });
  return categories
    .filter((c) => c._count > 0)
    .map((c) => ({ category: TOUR_CATEGORY_META[c.category].slug }));
}

async function getFeaturedAndRecommended(category: TourCategory) {
  const categoryTours = await prisma.tour.findMany({
    // Kashmir-branded trip-type page — Kashmir/Ladakh tours only.
    where: { category, published: true, region: { in: KASHMIR_SITE_REGIONS } },
    include: { destinations: { include: { destination: { select: { name: true } } } } },
  });
  if (categoryTours.length === 0) return null;
  // Same deterministic order as /tours and the homepage (src/lib/tours/ordering.ts).
  categoryTours.sort(compareToursForCards);

  const [featured, ...restOfCategory] = categoryTours;

  // Fill "Recommended" with the rest of this category first, then top up
  // with other bestsellers site-wide so the page never looks thin.
  const needed = Math.max(0, 6 - restOfCategory.length);
  const otherBestsellers =
    needed > 0
      ? (
          await prisma.tour.findMany({
            where: {
              published: true,
              region: { in: KASHMIR_SITE_REGIONS },
              category: { not: category },
              id: { notIn: [featured.id] },
            },
            include: { destinations: { include: { destination: { select: { name: true } } } } },
          })
        )
          .sort(compareToursForCards)
          .slice(0, needed)
      : [];

  return { featured, recommended: [...restOfCategory, ...otherBestsellers].slice(0, 6) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return buildMetadata({ title: "Not Found", description: "", noindex: true });

  const meta = TOUR_CATEGORY_META[category];
  return buildMetadata({
    // ≤34 chars, so the " | Vertex Kashmir Holidays" suffix survives the 60-char cap.
    title: `Kashmir ${meta.pageTitle}`,
    description: meta.metaDescription,
    canonical: `${SITE_URL}/tours/category/${meta.slug}`,
  });
}

export default async function TourCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const meta = TOUR_CATEGORY_META[category];
  const [data, settings, heroStats] = await Promise.all([
    getFeaturedAndRecommended(category),
    getSiteSettings(),
    getPublicHeroStats(),
  ]);
  if (!data) notFound();

  const { featured, recommended } = data;

  const featuredPlaces = featured.destinations.map((d) => d.destination.name).join(", ");

  const recommendedCards = recommended.map((t) => ({
    badge: t.badge ?? meta.shortLabel,
    bc: (BADGE_COLORS as readonly string[]).includes(t.badgeColor ?? "")
      ? (t.badgeColor as (typeof BADGE_COLORS)[number])
      : ("green" as const),
    category: t.category,
    image: t.coverImage ?? undefined,
    detailHref: `/tours/${t.slug}`,
    bookHref: `/booking?tour=${t.slug}`,
    t: t.title,
    d: `${Math.max(t.duration - 1, 0)}N / ${t.duration}D`,
    places: t.destinations.map((d) => d.destination.name).join(", "),
    r: t.rating.toFixed(1),
    n: String(t.reviewCount),
    ...tourCardPricing(t),
  }));

  const pageUrl = `${SITE_URL}/tours/category/${meta.slug}`;
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Tours", url: `${SITE_URL}/tours` },
    { name: meta.pageTitle, url: pageUrl },
  ]);
  const collectionJsonLd = buildCollectionPage({
    name: `Kashmir ${meta.pageTitle}`,
    description: meta.metaDescription,
    url: pageUrl,
  });
  const itemListJsonLd = buildItemList(
    [featured, ...recommended].map((t) => ({ name: t.title, url: `${SITE_URL}/tours/${t.slug}` })),
    `Kashmir ${meta.pageTitle}`,
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={itemListJsonLd} />

      <TourCategoryHero
        pageTitle={meta.pageTitle}
        subtitle={`Handpicked ${meta.shortLabel.toLowerCase()} tours in Kashmir, curated by local experts — compare packages and get a free quote today.`}
        stats={heroStats}
        whatsappMessage={`Hi! I'd like help planning a Kashmir ${meta.shortLabel.toLowerCase()} trip.`}
        sourcePage={`tours/category/${meta.slug}`}
      />

      <div className="mx-auto max-w-[1300px] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <TourCategoryFeatured
              tour={{
                slug: featured.slug,
                title: featured.title,
                excerpt: featured.excerpt,
                image: featured.coverImage,
                duration: featured.duration,
                places: featuredPlaces,
                rating: featured.rating,
                reviewCount: featured.reviewCount,
                ...publicPriceFields(featured),
                minPersons: featured.minPersons,
              }}
            />
            <TourCategoryRecommended tours={recommendedCards} />
          </div>

          <div className="space-y-5">
            <AffordabilityWidget amount={featured.priceFrom} />
            <TourDetailsSidebar
              priceHidden={featured.hidePrice}
              price={featured.hidePrice ? 0 : featured.priceFrom}
              oldPrice={featured.hidePrice ? undefined : (featured.priceWas ?? undefined)}
              discountPct={featured.hidePrice ? undefined : (featured.discountPct ?? undefined)}
              minPersons={featured.minPersons}
              leadSource="tour-category"
              inlineFormsOnMobile
              rating={featured.rating}
              reviews={featured.reviewCount}
              tourId={featured.id}
              tourName={featured.title}
              tourSlug={featured.slug}
              formMode={effectiveFormMode(featured)}
              bestTime={featured.bestTime ?? "Apr – Oct"}
              tourType={featured.tourType ?? "Private Tour"}
              pickupDrop={featured.pickupDrop ?? `${featured.startCity ?? "Srinagar"} Airport`}
              helpPhone={settings?.sitePhone ?? "+91 94190 00000"}
            />
          </div>
        </div>
      </div>

      <TrustSection type="category" name={meta.pageTitle} />
    </div>
  );
}
