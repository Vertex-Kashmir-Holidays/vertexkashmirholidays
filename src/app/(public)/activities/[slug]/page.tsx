import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import {
  JsonLd,
  buildBreadcrumbList,
  buildTouristAttraction,
  buildImageObjectList,
  buildFAQPage,
} from "@/components/seo/JsonLd";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroLeadCard } from "@/components/leads/HeroLeadCard";
import { imgSrc } from "@/lib/placeholder";
import { formatINR } from "@/lib/accents";
import { parseJson } from "@/lib/tours/content";
import { ActivityQuickFacts } from "@/components/activities/ActivityQuickFacts";
import { ActivityWhyExperience } from "@/components/activities/ActivityWhyExperience";
import { ActivityHighlights } from "@/components/activities/ActivityHighlights";
import { ActivityBestTime } from "@/components/activities/ActivityBestTime";
import { ActivityDifficulty } from "@/components/activities/ActivityDifficulty";
import { ActivitySuitableFor } from "@/components/activities/ActivitySuitableFor";
import { ActivityPricingGuide } from "@/components/activities/ActivityPricingGuide";
import { ActivitySafetyTips } from "@/components/activities/ActivitySafetyTips";
import { ActivityWhatToCarry } from "@/components/activities/ActivityWhatToCarry";
import { ActivityNearby } from "@/components/activities/ActivityNearby";
import { ActivityRelatedDestinations } from "@/components/activities/ActivityRelatedDestinations";
import { TourDetailsGallery } from "@/components/tours/TourDetailsGallery";
import { TourDetailsFAQs } from "@/components/tours/TourDetailsFAQs";
import { DestinationDetailTours, type DestinationTour } from "@/components/destinations/DestinationDetailTours";
import { DestinationRelatedBlogs } from "@/components/destinations/DestinationRelatedBlogs";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

const BADGE_COLORS = ["orange", "blue", "green"] as const;

async function getActivity(slug: string) {
  return prisma.activity.findFirst({
    where: { slug, published: true },
    include: {
      tours: {
        where: { tour: { published: true } },
        include: {
          tour: {
            include: { destinations: { include: { destination: { select: { name: true } } } } },
          },
        },
      },
      destinations: {
        include: {
          destination: {
            select: { id: true, slug: true, name: true, tagline: true, coverImage: true, relatedBlogIds: true },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await prisma.activity.findFirst({
    where: { slug, published: true },
    select: { name: true, description: true, coverImage: true, metaTitle: true, metaDesc: true, ogImage: true },
  });

  if (!activity) {
    return buildMetadata({
      title: "Activity Not Found",
      description: "The Kashmir activity you are looking for could not be found.",
      canonical: `${SITE_URL}/activities/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: activity.metaTitle ?? activity.name,
    description:
      activity.metaDesc ??
      activity.description ??
      `${activity.name} — a handpicked Kashmir experience by Vertex Kashmir Holidays.`,
    canonical: `${SITE_URL}/activities/${slug}`,
    ogImage: activity.ogImage ?? activity.coverImage ?? null,
  });
}

export default async function ActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await getActivity(slug);
  if (!activity) notFound();

  const gallery = parseJson<string[]>(activity.images, []);
  const activityHighlights = parseJson<{ name: string; description: string }[]>(activity.activityHighlights, []);
  const suitableFor = parseJson<string[]>(activity.suitableFor, []);
  const safetyTips = parseJson<string[]>(activity.safetyTips, []);
  const whatToCarry = parseJson<string[]>(activity.whatToCarry, []);
  const faqs = parseJson<{ question: string; answer: string }[]>(activity.faqs, []);

  const relatedDestinations = activity.destinations.map((d) => d.destination);

  const relatedTours: DestinationTour[] = activity.tours.map(({ tour: t }) => ({
    badge: t.badge ?? "FEATURED",
    bc: (BADGE_COLORS as readonly string[]).includes(t.badgeColor ?? "")
      ? (t.badgeColor as (typeof BADGE_COLORS)[number])
      : "green",
    seed: t.id,
    image: t.coverImage ?? undefined,
    bookHref: `/tours/${t.slug}`,
    whatsappHref: "#",
    t: t.title,
    d: `${t.duration - 1}N / ${t.duration}D`,
    places: t.destinations.map((td) => td.destination.name).join(", "),
    r: t.rating.toFixed(1),
    n: String(t.reviewCount),
    old: t.priceWas ? formatINR(t.priceWas) : undefined,
    p: formatINR(t.priceFrom),
  }));

  // Nearby Activities — derived from shared destinations, no new relation.
  const destinationIds = relatedDestinations.map((d) => d.id);
  const nearbyRaw = destinationIds.length > 0
    ? await prisma.activity.findMany({
        where: {
          published: true,
          slug: { not: slug },
          destinations: { some: { destinationId: { in: destinationIds } } },
        },
        orderBy: { sortOrder: "asc" },
        take: 4,
        select: { id: true, slug: true, name: true, location: true, duration: true, price: true, coverImage: true },
      })
    : [];
  const nearbyActivities = nearbyRaw.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    location: a.location,
    duration: a.duration,
    price: a.price,
    image: a.coverImage,
  }));

  // Related Blogs — derived editorially from the linked destinations'
  // curated relatedBlogIds, not a new Activity ↔ Blog relation.
  const relatedBlogIds = Array.from(
    new Set(
      relatedDestinations.flatMap((d) => parseJson<string[]>(d.relatedBlogIds, [])),
    ),
  );
  const relatedBlogsRaw = relatedBlogIds.length > 0
    ? await prisma.blog.findMany({
        where: { id: { in: relatedBlogIds }, published: true },
        select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, category: true, publishedAt: true, readTime: true },
      })
    : [];
  const relatedBlogs = relatedBlogsRaw.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    excerpt: b.excerpt,
    coverImage: b.coverImage,
    category: b.category,
    dateLabel: b.publishedAt
      ? b.publishedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : null,
    readTime: b.readTime,
  }));

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Activities", url: `${SITE_URL}/activities` },
    { name: activity.name, url: `${SITE_URL}/activities/${activity.slug}` },
  ]);

  const attractionJsonLd = buildTouristAttraction({
    name: activity.name,
    slug: activity.slug,
    description: activity.description,
    coverImage: activity.coverImage,
    location: activity.location,
  });

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={attractionJsonLd} />
      {gallery.length > 0 && buildImageObjectList(gallery).map((img, i) => <JsonLd key={i} data={img} />)}
      {faqs.length > 0 && <JsonLd data={buildFAQPage(faqs)} />}

      <SecondaryHero
        image={activity.coverImage ?? "/hero/gulmarg-lg.webp"}
        imageMobile={activity.coverImageMobile}
        alt={activity.name}
        aside={<HeroLeadCard source="activity-detail" buttonLabel="Enquire Now" />}
      >
        <nav className="flex items-center gap-2 text-[12px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">Home</Link>
          <span>›</span>
          <Link href="/activities" className="transition hover:text-white">Activities</Link>
          <span>›</span>
          <span className="font-semibold text-white">{activity.name}</span>
        </nav>
        <h1 className="mt-6 h-display text-3xl font-bold text-white sm:text-4xl lg:text-[44px]">
          {activity.name}
        </h1>
      </SecondaryHero>

      <main className="mx-auto max-w-[1100px] space-y-6 px-6 py-10">
        {/* 2. Quick Facts */}
        <ActivityQuickFacts
          location={activity.location}
          duration={activity.duration}
          price={activity.price}
          difficulty={activity.difficulty}
        />

        {/* 3. Overview */}
        {activity.description && (
          <section id="overview" className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-[17px] font-bold">About this experience</h2>
            <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-foreground/85">
              {activity.description}
            </p>
          </section>
        )}

        {/* 4. Why Experience This */}
        <ActivityWhyExperience name={activity.name} html={activity.whyExperience} />

        {/* 5. Activity Highlights */}
        <ActivityHighlights highlights={activityHighlights} />

        {/* 6. Best Time */}
        <ActivityBestTime html={activity.bestTime} />

        {/* 7. Duration — already surfaced in Quick Facts above */}

        {/* 8. Difficulty */}
        <ActivityDifficulty difficulty={activity.difficulty} />

        {/* 9. Suitable For */}
        <ActivitySuitableFor items={suitableFor} />

        {/* 10. Pricing Guide */}
        <ActivityPricingGuide html={activity.pricingGuide} />

        {/* 11. Safety Tips */}
        <ActivitySafetyTips tips={safetyTips} />

        {/* 12. What to Carry */}
        <ActivityWhatToCarry items={whatToCarry} />

        {/* Featured Tours — moved here, right before Gallery */}
        {relatedTours.length > 0 && <DestinationDetailTours name={activity.name} tours={relatedTours} />}

        {/* 13. Gallery */}
        {gallery.length > 0 && (
          <TourDetailsGallery images={gallery.map((src) => ({ url: src, alt: activity.name }))} />
        )}

        {/* 15. Nearby Activities */}
        <ActivityNearby activities={nearbyActivities} />

        {/* 16. Where to Experience This (Destinations) */}
        <ActivityRelatedDestinations destinations={relatedDestinations} />

        {/* 18. Related Blogs */}
        <DestinationRelatedBlogs posts={relatedBlogs} />

        {/* 14. FAQs — moved to last */}
        <TourDetailsFAQs faqs={faqs} />

        {/* 19. Final CTA — already surfaced via the Hero's HeroLeadCard ("Enquire Now") */}
      </main>
    </div>
  );
}
