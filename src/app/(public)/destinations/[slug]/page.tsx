// src/app/(public)/destinations/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { getLiveWeather } from "@/lib/weather";
import { imgSrc } from "@/lib/placeholder";
import {
  JsonLd,
  buildBreadcrumbList,
  buildTouristDestination,
} from "@/components/seo/JsonLd";
import { formatINR } from "@/lib/accents";
import { DestinationDetailGallery } from "@/components/destinations/DestinationDetailGallery";
import { DestinationDetailHero } from "@/components/destinations/DestinationDetailHero";
import { DestinationDetailOverview } from "@/components/destinations/DestinationDetailOverview";
import { DestinationDetailSidebar } from "@/components/destinations/DestinationDetailSidebar";
import { DestinationDetailTabs } from "@/components/destinations/DestinationDetailTabs";
import { ActivitiesShowcase } from "@/components/activities/ActivitiesShowcase";
import {
  DestinationDetailTours,
  type DestinationTour,
} from "@/components/destinations/DestinationDetailTours";

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

const BADGE_COLORS = ["orange", "blue", "green"] as const;

// ── Decorative SVG icon paths (not stored in the DB) ────────────────────────
const ICON = {
  altitude: "m8 21 4-14 4 14M5 21h14M10 13h4",
  calendar: "M3 4h18v18H3zM16 2v4M8 2v4M3 10h18",
  star: "m12 3 2.7 5.6 6.3.9-4.5 4.4 1 6.1L12 17l-5.5 3 1-6.1L3 9.5l6.3-.9Z",
  package: "M3 11h18l-2 8H5ZM8 11V7a4 4 0 0 1 8 0v4",
  pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  camera:
    "M3 3h18v18H3zM9 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4M21 15l-3.8-3.8a2 2 0 0 0-2.8 0L6 20",
  overview: "M12 12a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 8v4l2.5 2.5",
  bolt: "m13 2-2 9h4l-4 11 1-8H8l5-12Z",
};

const TABS = [
  { id: "overview", label: "Overview", icon: ICON.overview },
  { id: "things", label: "Things to Do", icon: ICON.bolt },
  { id: "tours", label: "Tours", icon: ICON.package },
  { id: "gallery", label: "Gallery", icon: ICON.camera },
];

// Generic, destination-agnostic highlights (no DB backing yet).
const FEATURES = [
  {
    title: "Scenic Beauty",
    description: "Breathtaking landscapes in every season",
    icon: "M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4 M12 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    color: "text-sky-600 bg-sky-50",
  },
  {
    title: "Adventure",
    description: "Trekking, skiing and outdoor thrills",
    icon: "m4 20 16-6 M17 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M8 9l4 3-1 5 M12 12l4 1 2-3",
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Flower Meadows",
    description: "Blooming valleys in spring & summer",
    icon: "M12 8a3 3 0 1 0-3-3 M12 8a3 3 0 1 1 3-3 M12 8v9 M8 21h8 M7 13c2 0 3 1 3 1m7-1c-2 0-3 1-3 1",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Local Culture",
    description: "Warm hospitality and rich heritage",
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
    color: "text-teal-600 bg-emerald-50",
  },
];

async function getDestination(slug: string) {
  return prisma.destination.findUnique({
    where: { slug },
    include: {
      tours: {
        where: { tour: { published: true } },
        include: {
          tour: {
            include: {
              destinations: {
                include: { destination: { select: { name: true } } },
              },
            },
          },
        },
      },
      // Published activities linked to this destination → "Things to Do".
      activities: {
        where: { activity: { published: true } },
        include: {
          activity: {
            select: { id: true, slug: true, name: true, description: true, coverImage: true, duration: true },
          },
        },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dest = await prisma.destination.findUnique({
    where: { slug },
    select: {
      name: true,
      tagline: true,
      excerpt: true,
      description: true,
      coverImage: true,
      metaTitle: true,
      metaDesc: true,
      ogImage: true,
    },
  });

  if (!dest) {
    return buildMetadata({
      title: "Destination Not Found",
      description: "The Kashmir destination you are looking for could not be found.",
      canonical: `${SITE_URL}/destinations/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: dest.metaTitle ?? dest.name,
    description:
      dest.metaDesc ??
      dest.excerpt ??
      dest.description ??
      `${dest.name} — a curated Kashmir destination by Vertex Kashmir Holidays.`,
    canonical: `${SITE_URL}/destinations/${slug}`,
    ogImage: dest.ogImage ?? dest.coverImage ?? null,
  });
}

export default async function DestinationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const dest = await getDestination(slug);

  if (!dest) notFound();

  // ── Display facts: prefer explicit DB fields, fall back to deriving from
  // `location` for older records that predate the dedicated columns. ──────────
  const region =
    dest.region ?? (/ladakh/i.test(dest.location ?? "") ? "Ladakh" : "Kashmir Valley");
  const altMatch = dest.location?.match(/([\d,]+)\s*m\b/i);
  const altitude = dest.altitude ?? (altMatch ? `${altMatch[1]} m` : "High Altitude");
  const season = dest.season ?? "Apr – Oct";

  // Live current conditions from Open-Meteo when the destination has coords.
  const liveWeather =
    dest.latitude != null && dest.longitude != null
      ? await getLiveWeather(dest.latitude, dest.longitude)
      : null;

  const tours = dest.tours.map((td) => td.tour);
  const totalReviews = tours.reduce((sum, t) => sum + t.reviewCount, 0);
  const avgRating = tours.length
    ? tours.reduce((sum, t) => sum + t.rating, 0) / tours.length
    : 4.8;

  const heroImage = imgSrc(dest.coverImage);

  const stats = [
    { value: altitude, label: "Altitude", icon: ICON.altitude },
    { value: season, label: "Best Season", icon: ICON.calendar },
    {
      value: String(tours.length),
      label: tours.length === 1 ? "Tour Package" : "Tour Packages",
      icon: ICON.package,
    },
    {
      value: `${avgRating.toFixed(1)}/5`,
      label: `${totalReviews.toLocaleString()} reviews`,
      icon: ICON.star,
    },
  ];

  const destinationTours: DestinationTour[] = tours.map((t) => ({
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
    places: t.destinations.map((d) => d.destination.name).join(", "),
    r: t.rating.toFixed(1),
    n: String(t.reviewCount),
    old: t.priceWas ? formatINR(t.priceWas) : undefined,
    p: formatINR(t.priceFrom),
  }));

  // Things to Do — driven by the Activities module (published, linked to this
  // destination). The section hides itself when nothing is linked.
  const things = dest.activities.map((a) => ({
    id: a.activity.id,
    image: a.activity.coverImage,
    title: a.activity.name,
    description: a.activity.description ?? "",
    duration: a.activity.duration,
    href: `/activities/${a.activity.slug}`,
  }));

  // Gallery = the destination cover + the cover images of its linked activities
  // (real content, no external placeholders).
  const gallery = [dest.coverImage, ...dest.activities.map((a) => a.activity.coverImage)].filter(
    (img): img is string => Boolean(img),
  );

  const quickInfo = [
    { label: "Location", value: dest.location ?? "Jammu & Kashmir", icon: ICON.pin },
    { label: "Altitude", value: altitude, icon: ICON.altitude },
    { label: "Best Time to Visit", value: season, icon: ICON.calendar },
    { label: "Famous For", value: dest.tagline ?? "Scenic beauty", icon: ICON.star },
    { label: "Region", value: region, icon: ICON.pin },
    {
      label: "Tour Packages",
      value: `${tours.length} available`,
      icon: ICON.package,
    },
  ];

  // Live weather when available, otherwise a neutral fallback so the widget
  // always renders.
  const weather = liveWeather ?? {
    temperature: 18,
    condition: "Partly Cloudy",
    humidity: 56,
    wind: 12,
    feelsLike: 16,
  };

  // ── Structured data (JSON-LD) ─────────────────────────────────────────────
  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Destinations", url: `${SITE_URL}/destinations` },
    { name: dest.name, url: `${SITE_URL}/destinations/${dest.slug}` },
  ]);

  const destinationJsonLd = buildTouristDestination({
    name: dest.name,
    slug: dest.slug,
    description: dest.description ?? dest.excerpt,
    coverImage: dest.coverImage,
    location: dest.location,
  });

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={destinationJsonLd} />

      <DestinationDetailHero
        name={dest.name}
        tagline={dest.tagline ?? ""}
        description={dest.description ?? dest.excerpt ?? ""}
        region={region}
        image={heroImage}
        stats={stats}
      />

      <DestinationDetailTabs sections={TABS} />

      <main className="relative z-10 bg-background pb-16">
        <div className="mx-auto max-w-[1300px] px-6 pt-8">
          <div className="grid items-start gap-7 lg:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-7">
              <DestinationDetailOverview
                name={dest.name}
                description={dest.description ?? dest.excerpt ?? ""}
                features={FEATURES}
              />
              <ActivitiesShowcase title={`Things to Do in ${dest.name}`} items={things} seeAllHref="/activities" />
              {destinationTours.length > 0 && (
                <DestinationDetailTours name={dest.name} tours={destinationTours} />
              )}
              <DestinationDetailGallery name={dest.name} images={gallery} />
            </div>

            <DestinationDetailSidebar
              name={dest.name}
              quickInfo={quickInfo}
              weather={weather}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
