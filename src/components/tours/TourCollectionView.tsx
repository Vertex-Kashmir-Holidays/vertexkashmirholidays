import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import {
  JsonLd,
  buildBreadcrumbList,
  buildCollectionPage,
  buildFAQPage,
  buildItemList,
} from "@/components/seo/JsonLd";
import { getPublicHeroStats } from "@/lib/publicHeroStats";
import { KASHMIR_SITE_REGIONS } from "@/lib/tours/regions";
import {
  packageOptionCard,
  tourCardInclusions,
  tourCardOptions,
  tourCardPricing,
} from "@/lib/tours/cards";
import { getLiveTourCollections } from "@/lib/tours/collectionQueries";
import { getBannersForPage, toPromoBannerData } from "@/lib/banners";
import { TourCategoryHero } from "@/components/tours/TourCategoryHero";
import { TourCollectionGrid } from "@/components/tours/TourCollectionGrid";
import { TourCategoryHubWhyChoose } from "@/components/tours/TourCategoryHubWhyChoose";
import { TourCollectionLinks } from "@/components/tours/TourCollectionLinks";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { FaqPreviewList } from "@/components/faqs/FaqPreviewList";
import { TrustSection } from "@/components/common/TrustSection";

// A Tour Collection landing page (/kashmir-tour-packages, /himachal-tour-packages,
// …), served by the shared top-level (public)/[slug] route. Lists every
// published Tour assigned to the collection; each card links to that tour's
// one canonical /tours/[slug] URL — collections never get nested tour URLs.

const BADGE_COLORS = ["orange", "blue", "green"] as const;

// Shared by generateMetadata() and the page — one query per request. A
// collection that is unpublished, or has no published tours, is treated as
// not found (404 + noindex), so an empty landing page is never indexed.
export const getTourCollectionPage = cache(async (slug: string) => {
  const collection = await prisma.tourCollection.findFirst({
    where: { slug, published: true },
    include: {
      tours: {
        where: { published: true },
        orderBy: [{ bestseller: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          category: true,
          badge: true,
          badgeColor: true,
          duration: true,
          coverImage: true,
          rating: true,
          reviewCount: true,
          priceFrom: true,
          priceWas: true,
          minPersons: true,
          region: true,
          packageOptions: true,
          destinations: { select: { destination: { select: { name: true } } } },
        },
      },
      faqs: {
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        select: { id: true, question: true, shortAnswer: true, slug: true },
      },
    },
  });
  if (!collection || collection.tours.length === 0) return null;
  return collection;
});

export async function tourCollectionMetadata(slug: string): Promise<Metadata> {
  const c = await getTourCollectionPage(slug);
  if (!c) return buildMetadata({ title: "Not Found", description: "", noindex: true });
  return buildMetadata({
    title: c.metaTitle || c.name,
    description:
      c.metaDesc ||
      c.intro ||
      `${c.name} from Vertex Kashmir Holidays — compare itineraries and prices, then get a free quote.`,
    canonical: `${SITE_URL}/${c.slug}`,
    ogImage: c.ogImage || c.heroImage || null,
  });
}

export async function TourCollectionView({ slug }: { slug: string }) {
  const c = await getTourCollectionPage(slug);
  if (!c) notFound();

  // Kashmir-branded copy (hero stats, "Local Kashmir Experts", trust text)
  // only when every tour in the collection is Kashmir/Ladakh; any other mix
  // (e.g. Himachal) gets the neutral variants so nothing Kashmir-specific leaks.
  const isKashmirCollection = c.tours.every((t) => KASHMIR_SITE_REGIONS.includes(t.region));
  const [stats, allCollections, midBanners, endBanners] = await Promise.all([
    isKashmirCollection ? getPublicHeroStats() : Promise.resolve(undefined),
    getLiveTourCollections(),
    // Admin → Banners slots shared by every collection page.
    getBannersForPage("tour-collection-after-6"),
    getBannersForPage("tour-collection-after-all"),
  ]);
  const otherCollections = allCollections.filter((x) => x.slug !== c.slug);

  const url = `${SITE_URL}/${c.slug}`;
  const intro =
    c.intro || `Compare our ${c.name.toLowerCase()} and get a free, no-obligation quote.`;

  // One card per tour — or, for a tour sold as package options, one card per
  // published option (each deep-linking to that option on the tour page).
  const items = c.tours.flatMap((t) => {
    const common = {
      category: t.category,
      bc: (BADGE_COLORS as readonly string[]).includes(t.badgeColor ?? "")
        ? (t.badgeColor as (typeof BADGE_COLORS)[number])
        : ("green" as const),
      d: `${Math.max(t.duration - 1, 0)}N / ${t.duration}D`,
      r: t.rating.toFixed(1),
      n: String(t.reviewCount),
    };
    return tourCardOptions(t.packageOptions).map((option) => {
      if (!option) {
        return {
          priceFrom: t.priceFrom,
          rating: t.rating,
          card: {
            ...common,
            badge: t.badge ?? "FEATURED",
            image: t.coverImage ?? undefined,
            detailHref: `/tours/${t.slug}`,
            bookHref: `/tours/${t.slug}`,
            t: t.title,
            places: t.destinations.map((d) => d.destination.name).join(", "),
            ...tourCardPricing(t),
            inclusions: tourCardInclusions(t.region),
          },
        };
      }
      const pkg = packageOptionCard(t, option);
      return {
        priceFrom: pkg.priceFrom,
        rating: t.rating,
        card: {
          ...common,
          badge: pkg.badge,
          image: pkg.image ?? undefined,
          detailHref: pkg.detailHref,
          bookHref: pkg.detailHref,
          t: pkg.title,
          places: pkg.places,
          ...tourCardPricing({ ...t, priceForTwo: pkg.priceForTwo }),
          inclusions: pkg.inclusions,
        },
      };
    });
  });

  return (
    <div className="bg-background text-foreground">
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", url: SITE_URL },
          { name: "Tours", url: `${SITE_URL}/tours` },
          { name: c.name, url },
        ])}
      />
      <JsonLd data={buildCollectionPage({ name: c.name, description: intro, url })} />
      <JsonLd
        data={buildItemList(
          c.tours.map((t) => ({ name: t.title, url: `${SITE_URL}/tours/${t.slug}` })),
          c.name,
        )}
      />
      {/* Short answer only — matches what's rendered on this page. */}
      {c.faqs.length > 0 && (
        <JsonLd
          data={buildFAQPage(c.faqs.map((f) => ({ question: f.question, answer: f.shortAnswer })))}
        />
      )}

      <TourCategoryHero
        pageTitle={c.name}
        subtitle={intro}
        heroImage={c.heroImage || undefined}
        heroImageMobile={c.heroImageMobile || c.heroImage || undefined}
        imageAlt={c.name}
        stats={stats}
        leadSource="tour-collection"
        leadContext={{ destinationName: c.name }}
        leadKicker={isKashmirCollection ? undefined : "Plan Your Trip"}
        whatsappMessage={`Hi! I'd like help choosing from your ${c.name}.`}
        whatsappSource="tour_collection_hero"
        whatsappLabel={isKashmirCollection ? undefined : "Chat With Our Travel Team"}
        sourcePage={c.slug}
      />

      <div className="mx-auto max-w-[1300px] space-y-14 px-4 py-12 sm:px-6 sm:py-16">
        <TourCollectionGrid
          items={items}
          midBanners={toPromoBannerData(midBanners)}
          endBanners={toPromoBannerData(endBanners)}
          title={`${items.length} ${items.length === 1 ? "Package" : "Packages"} to Choose From`}
        />

        {c.content && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-9">
            <BlogPostBody html={c.content} />
          </section>
        )}

        <TourCategoryHubWhyChoose variant={isKashmirCollection ? "kashmir" : "general"} />

        {c.faqs.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-3 shadow-soft sm:p-6">
            <h2 className="h-display text-[22px] font-bold text-foreground sm:text-[26px]">
              {c.name} — FAQs
            </h2>
            <div className="mt-4">
              <FaqPreviewList faqs={c.faqs} />
            </div>
          </section>
        )}

        <section className="border-t border-border pt-8 text-[14px] text-muted-foreground">
          Looking for something else?{" "}
          <Link href="/tours" className="font-semibold text-primary hover:underline">
            Browse all tour packages
          </Link>
          .
        </section>
      </div>

      {otherCollections.length > 0 && (
        <div className="pb-12">
          <TourCollectionLinks collections={otherCollections} />
        </div>
      )}

      <TrustSection type={isKashmirCollection ? "category" : "collection"} name={c.name} />
    </div>
  );
}
