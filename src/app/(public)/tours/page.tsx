// src/app/(public)/tours/page.tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  JsonLd,
  buildBreadcrumbList,
  buildItemList,
} from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { ToursHeroSection } from "@/components/tours/ToursHeroSection";
import { ToursNewsletter } from "@/components/tours/ToursNewsletter";
import { ToursPageClient } from "@/components/tours/ToursPageClient";
import { ToursTrustBar } from "@/components/tours/ToursTrustBar";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const section = await prisma.homeSection.findUnique({
    where: { key: "toursHero" },
  });

  return buildMetadata({
    title: "Kashmir Tour Packages — Honeymoon, Family & Adventure Trips",
    description:
      section?.subtitle ??
      "Browse all Kashmir tour packages from Vertex Kashmir Holidays — honeymoon, family, adventure and luxury itineraries with Dal Lake houseboats, Gulmarg Gondola and glacier treks. Book online with local experts.",
    canonical: `${SITE_URL}/tours`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function ToursPage() {
  const [section, stats, tours] = await Promise.all([
    prisma.homeSection.findUnique({ where: { key: "toursHero" } }),
    prisma.siteStat.findMany({ where: { section: "hero" }, orderBy: { sortOrder: "asc" } }),
    prisma.tour.findMany({
      where: { published: true },
      orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
      select: {
        id: true, slug: true, title: true, badge: true, badgeColor: true,
        duration: true, coverImage: true, rating: true, reviewCount: true,
        priceFrom: true, priceWas: true, category: true, region: true,
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
      <ToursHeroSection
        heading={{
          kicker: section?.kicker ?? null,
          title: section?.title ?? null,
          subtitle: section?.subtitle ?? null,
          ctaLabel: section?.ctaLabel ?? null,
          ctaHref: section?.ctaHref ?? null,
        }}
        heroImage={section?.heroImage ?? null}
        heroImageMobile={section?.heroImageMobile ?? null}
        stats={stats.map((s) => ({ label: s.label, value: s.value, suffix: s.suffix }))}
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
