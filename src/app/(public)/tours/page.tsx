// src/app/(public)/tours/page.tsx
import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { JsonLd, buildBreadcrumbList, buildItemList } from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { ListingHero } from "@/components/layout/ListingHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import { ToursNewsletter } from "@/components/tours/ToursNewsletter";
import { ToursPageClient } from "@/components/tours/ToursPageClient";
import { ToursTrustBar } from "@/components/tours/ToursTrustBar";
import { getPublicHeroStats } from "@/lib/publicHeroStats";
import { packageOptionCard, tourCardOptions } from "@/lib/tours/cards";
import { KASHMIR_SITE_REGIONS } from "@/lib/tours/regions";
import { getLiveTourCollections } from "@/lib/tours/collectionQueries";

// 24h safety net — Tour mutations invalidate this page directly (src/lib/cache.ts).
export const revalidate = 86400;

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getToursHeroSection = cache(() =>
  prisma.homeSection.findUnique({ where: { key: "toursHero" } }),
);

export async function generateMetadata(): Promise<Metadata> {
  const section = await getToursHeroSection();

  return buildMetadata({
    // /tours is the All Tours catalogue; Kashmir commercial intent is owned by
    // the /kashmir-tour-packages Tour Collection, so nothing here targets it.
    title: section?.metaTitle || "All Tour Packages — Kashmir, Ladakh, Himachal & More",
    description:
      section?.metaDescription ||
      section?.subtitle ||
      "Browse every Vertex tour package in one place — Kashmir, Ladakh, Himachal and more. Compare itineraries, durations and prices, then get a free quote from our travel team.",
    canonical: `${SITE_URL}/tours`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function ToursPage() {
  const [section, stats, collections, tours] = await Promise.all([
    getToursHeroSection(),
    getPublicHeroStats(),
    getLiveTourCollections(),
    prisma.tour.findMany({
      where: { published: true },
      orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        badge: true,
        badgeColor: true,
        duration: true,
        coverImage: true,
        rating: true,
        reviewCount: true,
        priceFrom: true,
        priceWas: true,
        minPersons: true,
        category: true,
        region: true,
        packageOptions: true,
        destinations: { select: { destination: { select: { name: true } } } },
      },
    }),
  ]);

  // ── Structured data (JSON-LD) ────────────────────────────────────────────
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Tours", url: `${SITE_URL}/tours` },
  ]);

  const toursJsonLd = buildItemList(
    tours.map((t) => ({
      name: t.title,
      url: `${SITE_URL}/tours/${t.slug}`,
    })),
    "All Tour Packages",
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {tours.length > 0 && <JsonLd data={toursJsonLd} />}
      <ListingHero
        heading={{
          kicker: section?.kicker ?? null,
          title: section?.title ?? "All Tour Packages",
          subtitle: section?.subtitle ?? null,
          ctaLabel: section?.ctaLabel ?? null,
          ctaHref: section?.ctaHref ?? null,
        }}
        breadcrumbLabel="Tours"
        heroImage={section?.heroImage ?? null}
        heroImageMobile={section?.heroImageMobile ?? null}
        defaultImage="/hero/gulmarg-lg.webp"
        defaultImageMobile="/hero/gulmarg.webp"
        alt="Kashmir valley"
        stats={stats}
        aside={
          <HeroLeadCard
            source="tours"
            kicker={section?.formKicker ?? undefined}
            title={section?.formTitle ?? undefined}
            subtitle={section?.formSubtitle ?? undefined}
            buttonLabel={section?.formButtonLabel || "Get Tour Quotes"}
          />
        }
      />
      <ToursPageClient
        collections={collections}
        // Trip-type links go to the Kashmir-scoped /tours/category/* pages, so
        // only offer categories that have a Kashmir/Ladakh tour behind them.
        browseCategories={[
          ...new Set(
            tours.filter((t) => KASHMIR_SITE_REGIONS.includes(t.region)).map((t) => t.category),
          ),
        ]}
        // One card per tour, or per published package option for tours sold
        // that way (each deep-linking to its option on the tour page).
        tours={tours.flatMap((t) =>
          tourCardOptions(t.packageOptions).map((option) => {
            const base = {
              id: t.id,
              slug: t.slug,
              title: t.title,
              badge: t.badge,
              badgeColor: t.badgeColor,
              durationLabel: `${t.duration - 1}N / ${t.duration}D`,
              places: t.destinations.map((d) => d.destination.name).join(", "),
              image: t.coverImage,
              rating: t.rating,
              reviewCount: t.reviewCount,
              priceFrom: t.priceFrom,
              priceWas: t.priceWas,
              minPersons: t.minPersons,
              category: t.category,
              region: t.region,
              durationDays: t.duration,
            };
            if (!option) return base;
            const pkg = packageOptionCard(t, option);
            return {
              ...base,
              id: pkg.key,
              title: pkg.title,
              badge: pkg.badge,
              places: pkg.places,
              image: pkg.image,
              priceFrom: pkg.priceFrom,
              priceWas: null,
              detailHref: pkg.detailHref,
              priceForTwo: pkg.priceForTwo,
              inclusions: pkg.inclusions,
            };
          }),
        )}
      />
      <ToursTrustBar />
      <ToursNewsletter />
    </div>
  );
}
