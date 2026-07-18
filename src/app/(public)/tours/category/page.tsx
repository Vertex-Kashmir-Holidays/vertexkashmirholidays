// src/app/(public)/tours/category/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  JsonLd,
  buildBreadcrumbList,
  buildCollectionPage,
  buildItemList,
  buildFAQPage,
} from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { TOUR_CATEGORY_META, type TourCategoryMeta } from "@/lib/tours/categories";
import { TourCategoryHero } from "@/components/tours/TourCategoryHero";
import { TourCategoryHubIntro } from "@/components/tours/TourCategoryHubIntro";
import {
  TourCategoryHubGrid,
  type TourCategoryCardData,
} from "@/components/tours/TourCategoryHubGrid";
import { TourCategoryHubWhyChoose } from "@/components/tours/TourCategoryHubWhyChoose";
import { TourCategoryHubFaq } from "@/components/tours/TourCategoryHubFaq";
import { TourCategoryHubSpotlight } from "@/components/tours/TourCategoryHubSpotlight";
import { TOUR_CATEGORY_HUB_FAQS } from "@/lib/tours/categoryHubFaqs";
import { TrustSection } from "@/components/common/TrustSection";
import type { TourCategory } from "@prisma/client";

export const revalidate = 300;

const PAGE_TITLE = "Kashmir Tour Categories";
const PAGE_DESCRIPTION =
  "Explore our carefully curated Kashmir tour categories designed for honeymoon couples, families, groups, adventure seekers and luxury travellers.";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `${PAGE_TITLE} — Honeymoon, Family, Adventure & Luxury Packages`,
    description:
      "Browse every Kashmir tour category — honeymoon, family, group, adventure, luxury, budget, pilgrimage and premium packages — and find the trip built for how you want to travel.",
    canonical: `${SITE_URL}/tours/category`,
  });
}

async function getCategoryCards(): Promise<TourCategoryCardData[]> {
  const [counts, representative] = await Promise.all([
    prisma.tour.groupBy({ by: ["category"], where: { published: true }, _count: true }),
    prisma.tour.findMany({
      where: { published: true },
      distinct: ["category"],
      orderBy: [{ bestseller: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
      select: { category: true, coverImage: true },
    }),
  ]);

  const countMap = new Map(counts.map((c) => [c.category, c._count]));
  const imageMap = new Map(representative.map((t) => [t.category, t.coverImage]));

  return (Object.entries(TOUR_CATEGORY_META) as [TourCategory, TourCategoryMeta][])
    .map(([category, meta]) => ({
      slug: meta.slug,
      pageTitle: meta.pageTitle,
      emoji: meta.emoji,
      cardDescription: meta.cardDescription,
      tourCount: countMap.get(category) ?? 0,
      image: imageMap.get(category) ?? null,
    }))
    .filter((c) => c.tourCount > 0);
}

export default async function TourCategoryHubPage() {
  const categoryCards = await getCategoryCards();

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Tours", url: `${SITE_URL}/tours` },
    { name: PAGE_TITLE, url: `${SITE_URL}/tours/category` },
  ]);

  const collectionPageJsonLd = buildCollectionPage({
    name: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/tours/category`,
  });

  const categoryItemListJsonLd = buildItemList(
    categoryCards.map((c) => ({ name: c.pageTitle, url: `${SITE_URL}/tours/category/${c.slug}` })),
    PAGE_TITLE,
  );

  const faqJsonLd = buildFAQPage(TOUR_CATEGORY_HUB_FAQS);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={collectionPageJsonLd} />
      {categoryCards.length > 0 && <JsonLd data={categoryItemListJsonLd} />}
      <JsonLd data={faqJsonLd} />

      <TourCategoryHero
        pageTitle={PAGE_TITLE}
        subtitle={PAGE_DESCRIPTION}
        ctaLabel="Browse Tours"
        ctaHref="/tours"
      />

      <div className="mx-auto max-w-[1300px] space-y-16 px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <TourCategoryHubIntro />
          <TourCategoryHubSpotlight />
        </div>

        <section>
          <h2 className="h-display text-[22px] font-bold text-foreground sm:text-[26px]">
            Browse by Category
          </h2>
          {categoryCards.length > 0 ? (
            <div className="mt-6">
              <TourCategoryHubGrid categories={categoryCards} />
            </div>
          ) : (
            <p className="mt-4 text-[14px] text-muted-foreground">
              New categories are being added — check back soon, or{" "}
              <Link href="/tours" className="font-semibold text-primary hover:underline">
                browse all tours
              </Link>{" "}
              in the meantime.
            </p>
          )}
        </section>

        <TourCategoryHubWhyChoose />

        <TourCategoryHubFaq />

        <section className="border-t border-border pt-8 text-[14px] text-muted-foreground">
          <p>
            Not sure where to start?{" "}
            <Link href="/tours" className="font-semibold text-primary hover:underline">
              Browse all Kashmir tours
            </Link>
            , explore our{" "}
            <Link href="/destinations" className="font-semibold text-primary hover:underline">
              Kashmir destinations
            </Link>
            , or head back to the{" "}
            <Link href="/" className="font-semibold text-primary hover:underline">
              homepage
            </Link>
            .
          </p>
        </section>
      </div>

      <TrustSection type="category" />
    </div>
  );
}
