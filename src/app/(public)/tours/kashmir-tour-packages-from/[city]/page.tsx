// src/app/(public)/tours/kashmir-tour-packages-from/[city]/page.tsx
//
// SEO discovery layer for origin-city searches ("Kashmir tour packages from
// Mumbai" etc.) — see .ai docs / conversation history for the product
// decision. One scalable dynamic route (not one file per city) driven by the
// static ORIGIN_CITIES config in @/lib/originCities, launched with the 5
// commercially important cities. There is no schema field tying a Tour to an
// outbound origin city (Tour.startCity is the LOCAL Kashmir pickup point), so
// every page shows the same real, published tour catalog — differentiated by
// genuinely distinct per-city travel-route copy and FAQs (not a template with
// the city name swapped), to avoid thin/doorway content.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { formatINR } from "@/lib/accents";
import {
  JsonLd,
  buildBreadcrumbList,
  buildCollectionPage,
  buildItemList,
  buildFAQPage,
} from "@/components/seo/JsonLd";
import { ORIGIN_CITIES, getOriginCityBySlug } from "@/lib/originCities";
import { getCityTransportRoutes, buildTransportFaqs } from "@/lib/transport/data";
import { CityOriginHero } from "@/components/tours/CityOriginHero";
import { TourCard } from "@/components/ui/organisms/TourCard";
import { TransportAssistanceBanner } from "@/components/tours/TransportAssistanceBanner";
import { TrustSection } from "@/components/common/TrustSection";
import { Plane, TrainFront } from "lucide-react";

export const revalidate = 300;

const BADGE_COLORS = ["orange", "blue", "green"] as const;

type PageProps = { params: Promise<{ city: string }> };

export async function generateStaticParams() {
  return ORIGIN_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getOriginCityBySlug(slug);
  if (!city) return buildMetadata({ title: "Not Found", description: "", noindex: true });

  return buildMetadata({
    title: `Kashmir Tour Packages from ${city.name}`,
    description: city.metaDescription,
    canonical: `${SITE_URL}/tours/kashmir-tour-packages-from/${city.slug}`,
  });
}

export default async function KashmirFromCityPage({ params }: PageProps) {
  const { city: slug } = await params;
  const city = getOriginCityBySlug(slug);
  if (!city) notFound();

  const tours = await prisma.tour.findMany({
    where: { published: true },
    include: { destinations: { include: { destination: { select: { name: true } } } } },
    orderBy: [{ bestseller: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
    take: 6,
  });
  if (tours.length === 0) notFound();

  // Factual flight/train data comes from the single central source — never
  // hardcode a duration/route fact directly in this page.
  const transportRoutes = getCityTransportRoutes(city.slug);
  const cityFaqs = buildTransportFaqs(city.name, transportRoutes);

  const pageUrl = `${SITE_URL}/tours/kashmir-tour-packages-from/${city.slug}`;

  const tourCards = tours.map((t) => ({
    badge: t.badge ?? "Popular",
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
    minPersons: t.minPersons,
  }));

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Tours", url: `${SITE_URL}/tours` },
    { name: `Kashmir Tour Packages from ${city.name}`, url: pageUrl },
  ]);
  const collectionJsonLd = buildCollectionPage({
    name: `Kashmir Tour Packages from ${city.name}`,
    description: city.metaDescription,
    url: pageUrl,
  });
  const itemListJsonLd = buildItemList(
    tours.map((t) => ({ name: t.title, url: `${SITE_URL}/tours/${t.slug}` })),
    `Kashmir Tour Packages from ${city.name}`,
  );
  const faqJsonLd = buildFAQPage(cityFaqs.map((f) => ({ question: f.question, answer: f.answer })));

  const otherCities = ORIGIN_CITIES.filter((c) => c.slug !== city.slug);

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={faqJsonLd} />

      <CityOriginHero cityName={city.akaName ? `${city.name} (${city.akaName})` : city.name} />

      <main className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 sm:py-14">
        {/* Intro — genuinely city-specific, not a templated blurb. */}
        <section>
          <h2 className="text-[22px] font-bold text-foreground sm:text-[26px]">
            Travelling to Kashmir from {city.name}
            {city.akaName ? ` (${city.akaName})` : ""}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Plane className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-foreground">By Air</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {transportRoutes.air?.notes ??
                    "We check current flight options for this route when you request a quote."}
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <TrainFront className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-foreground">By Train</p>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {transportRoutes.rail?.notes ??
                    "We check current train options for this route when you request a quote."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Flight/Train quote — same component + lead pipeline as the tour
           detail pages, prefilled with this page's origin city. */}
        <TransportAssistanceBanner placement="city-page" defaultFromCity={city.name} />

        {/* Real, published tours — never fabricated per-city content. */}
        <section className="mt-10">
          <h2 className="text-[22px] font-bold text-foreground sm:text-[26px]">
            Popular Kashmir Packages
          </h2>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Package prices below cover your Kashmir stay and ground experience only — flights or
            train tickets from {city.name} are arranged separately, on request.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tourCards.map((tour, i) => (
              <TourCard key={tour.detailHref} tour={tour} index={i} variant="tours" />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/tours"
              className="inline-flex items-center gap-1.5 text-[14px] font-bold text-primary hover:underline"
            >
              See all Kashmir tour packages →
            </Link>
          </div>
        </section>

        {/* City-specific FAQs. */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
          <h2 className="text-[18px] font-bold">FAQs — Kashmir Trips from {city.name}</h2>
          <dl className="mt-4 space-y-5">
            {cityFaqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-[14px] font-bold text-foreground">{faq.question}</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Cross-link the rest of the city cluster — spreads internal link
           equity and gives crawlers/users a path between all origin pages. */}
        <section className="mt-10">
          <p className="text-[13px] font-semibold text-muted-foreground">
            Also planning from another city?
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.slug}
                href={`/tours/kashmir-tour-packages-from/${c.slug}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-[13px] font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                Kashmir Packages from {c.name}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <TrustSection type="origin-city" name={city.name} />
    </div>
  );
}
