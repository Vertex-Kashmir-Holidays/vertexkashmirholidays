import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList, buildItemList } from "@/components/seo/JsonLd";
import { ListingHero } from "@/components/layout/ListingHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import { ActivitiesPageClient } from "@/components/activities/ActivitiesPageClient";
import { TransportAssistanceBanner } from "@/components/tours/TransportAssistanceBanner";

// 24h safety net — Activity mutations invalidate this page directly (src/lib/cache.ts).
export const revalidate = 86400;

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getActivitiesHeroSection = cache(() =>
  prisma.homeSection.findUnique({ where: { key: "activitiesHero" } }),
);

export async function generateMetadata(): Promise<Metadata> {
  const section = await getActivitiesHeroSection();
  return buildMetadata({
    title: section?.metaTitle || "Things to Do in Kashmir — Activities & Experiences",
    description:
      section?.metaDescription ||
      section?.subtitle ||
      "Discover the best things to do in Kashmir — shikara rides, Gulmarg gondola, trekking, skiing, river rafting and more. Handpicked activities by Vertex Kashmir Holidays.",
    canonical: `${SITE_URL}/activities`,
    ogImage: section?.ogImage ?? section?.heroImage ?? null,
  });
}

export default async function ActivitiesPage() {
  const [section, activities] = await Promise.all([
    getActivitiesHeroSection(),
    prisma.activity.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        location: true,
        duration: true,
        price: true,
        coverImage: true,
      },
    }),
  ]);

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Activities", url: `${SITE_URL}/activities` },
  ]);

  const listJsonLd = buildItemList(
    activities.map((a) => ({ name: a.name, url: `${SITE_URL}/activities/${a.slug}` })),
    "Things to Do in Kashmir",
  );

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      {activities.length > 0 && <JsonLd data={listJsonLd} />}

      <ListingHero
        heading={{
          kicker: section?.kicker ?? null,
          title: section?.title ?? "Things to Do in Kashmir",
          subtitle:
            section?.subtitle ??
            "Shikara sunsets, Gulmarg gondola, alpine treks and more — handpicked experiences for your trip.",
          ctaLabel: section?.ctaLabel ?? null,
          ctaHref: section?.ctaHref ?? null,
        }}
        breadcrumbLabel="Activities"
        heroImage={section?.heroImage ?? null}
        heroImageMobile={section?.heroImageMobile ?? null}
        defaultImage="/hero/gulmarg-lg.webp"
        defaultImageMobile="/hero/gulmarg.webp"
        alt="Things to do in Kashmir"
        aside={<HeroLeadCard source="activities" buttonLabel="Plan My Activities" />}
      />

      <ActivitiesPageClient
        activities={activities.map((a) => ({
          id: a.id,
          slug: a.slug,
          name: a.name,
          location: a.location,
          duration: a.duration,
          price: a.price,
          image: a.coverImage,
        }))}
      />

      <div className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 sm:py-12">
        <TransportAssistanceBanner placement="things-to-do" />
      </div>
    </div>
  );
}
