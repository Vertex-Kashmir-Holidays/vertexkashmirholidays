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
    title: section?.metaTitle || "Kashmir Tour Packages — Honeymoon, Family & Adventure Trips",
    description:
      section?.metaDescription ||
      section?.subtitle ||
      "Browse all Kashmir tour packages from Vertex Kashmir Holidays — honeymoon, family, adventure and luxury itineraries with Dal Lake houseboats, Gulmarg Gondola and glacier treks. Book online with local experts.",
    canonical: `${SITE_URL}/tours`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function ToursPage() {
  const [section, stats, tours] = await Promise.all([
    getToursHeroSection(),
    prisma.siteStat.findMany({ where: { section: "hero" }, orderBy: { sortOrder: "asc" } }),
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
        destinations: { select: { destination: { select: { name: true } } } },
      },
    }),
  ]);

  // ── Structured data (JSON-LD) ────────────────────────────────────────────
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Tour Packages", url: `${SITE_URL}/tours` },
  ]);

  const toursJsonLd = buildItemList(
    tours.map((t) => ({
      name: t.title,
      url: `${SITE_URL}/tours/${t.slug}`,
    })),
    "Kashmir Tour Packages",
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {tours.length > 0 && <JsonLd data={toursJsonLd} />}
      <ListingHero
        heading={{
          kicker: section?.kicker ?? null,
          title: section?.title ?? "Kashmir Tour Packages",
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
        stats={stats.map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }))}
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
        browseCategories={[...new Set(tours.map((t) => t.category))]}
        tours={tours.map((t) => ({
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
        }))}
      />
      <ToursTrustBar />
      <ToursNewsletter />
    </div>
  );
}
