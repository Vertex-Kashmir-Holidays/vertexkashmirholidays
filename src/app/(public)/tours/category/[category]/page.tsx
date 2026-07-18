// src/app/(public)/tours/category/[category]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import { JsonLd, buildBreadcrumbList } from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { formatINR } from "@/lib/accents";
import { TOUR_CATEGORY_META, getCategoryBySlug } from "@/lib/tours/categories";
import { TourCategoryHero } from "@/components/tours/TourCategoryHero";
import { TourCategoryFeatured } from "@/components/tours/TourCategoryFeatured";
import { TourCategoryRecommended } from "@/components/tours/TourCategoryRecommended";
import { AffordabilityWidget } from "@/components/payments/AffordabilityWidget";
import { TourDetailsSidebar } from "@/components/tours/TourDetailsSidebar";
import { TrustSection } from "@/components/common/TrustSection";
import type { TourCategory } from "@prisma/client";

export const revalidate = 300;

const BADGE_COLORS = ["orange", "blue", "green"] as const;

type PageProps = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  const categories = await prisma.tour.groupBy({
    by: ["category"],
    where: { published: true },
    _count: true,
  });
  return categories
    .filter((c) => c._count > 0)
    .map((c) => ({ category: TOUR_CATEGORY_META[c.category].slug }));
}

async function getFeaturedAndRecommended(category: TourCategory) {
  const categoryTours = await prisma.tour.findMany({
    where: { category, published: true },
    include: { destinations: { include: { destination: { select: { name: true } } } } },
    orderBy: [{ bestseller: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
  });
  if (categoryTours.length === 0) return null;

  const [featured, ...restOfCategory] = categoryTours;

  // Fill "Recommended" with the rest of this category first, then top up
  // with other bestsellers site-wide so the page never looks thin.
  const needed = Math.max(0, 6 - restOfCategory.length);
  const otherBestsellers =
    needed > 0
      ? await prisma.tour.findMany({
          where: { published: true, category: { not: category }, id: { notIn: [featured.id] } },
          include: { destinations: { include: { destination: { select: { name: true } } } } },
          orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
          take: needed,
        })
      : [];

  return { featured, recommended: [...restOfCategory, ...otherBestsellers].slice(0, 6) };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return buildMetadata({ title: "Not Found", description: "", noindex: true });

  const meta = TOUR_CATEGORY_META[category];
  return buildMetadata({
    title: `${meta.pageTitle} — Curated Kashmir Tours`,
    description: meta.metaDescription,
    canonical: `${SITE_URL}/tours/category/${meta.slug}`,
  });
}

export default async function TourCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const meta = TOUR_CATEGORY_META[category];
  const [data, settings] = await Promise.all([
    getFeaturedAndRecommended(category),
    getSiteSettings(),
  ]);
  if (!data) notFound();

  const { featured, recommended } = data;

  const featuredPlaces = featured.destinations.map((d) => d.destination.name).join(", ");

  const recommendedCards = recommended.map((t) => ({
    badge: t.badge ?? meta.shortLabel,
    bc: (BADGE_COLORS as readonly string[]).includes(t.badgeColor ?? "")
      ? (t.badgeColor as (typeof BADGE_COLORS)[number])
      : ("green" as const),
    image: t.coverImage ?? undefined,
    detailHref: `/tours/${t.slug}`,
    bookHref: `/booking?tour=${t.slug}`,
    t: t.title,
    d: `${Math.max(t.duration - 1, 0)}N / ${t.duration}D`,
    places: t.destinations.map((d) => d.destination.name).join(", "),
    r: t.rating.toFixed(1),
    n: String(t.reviewCount),
    old: t.priceWas ? formatINR(t.priceWas) : undefined,
    p: formatINR(t.priceFrom),
  }));

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Tours", url: `${SITE_URL}/tours` },
    { name: meta.pageTitle, url: `${SITE_URL}/tours/category/${meta.slug}` },
  ]);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />

      <TourCategoryHero
        pageTitle={meta.pageTitle}
        subtitle={`Handpicked ${meta.shortLabel.toLowerCase()} tours in Kashmir, curated by local experts — compare packages and get a free quote today.`}
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
                priceFrom: featured.priceFrom,
                priceWas: featured.priceWas,
              }}
            />
            <TourCategoryRecommended tours={recommendedCards} />
          </div>

          <div className="space-y-5">
            <AffordabilityWidget amount={featured.priceFrom} />
            <TourDetailsSidebar
              price={featured.priceFrom}
              oldPrice={featured.priceWas ?? undefined}
              discountPct={featured.discountPct ?? undefined}
              rating={featured.rating}
              reviews={featured.reviewCount}
              tourId={featured.id}
              tourName={featured.title}
              tourSlug={featured.slug}
              formMode={featured.formMode}
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
