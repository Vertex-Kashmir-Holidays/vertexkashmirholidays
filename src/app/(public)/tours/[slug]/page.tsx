// src/app/(public)/tours/[slug]/page.tsx
import { effectiveFormMode, tourCardPricing } from "@/lib/tours/cards";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import {
  JsonLd,
  buildProduct,
  buildTouristTrip,
  buildBreadcrumbList,
  buildFAQPage,
  buildCampaignEvents,
} from "@/components/seo/JsonLd";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { FaqPreviewList } from "@/components/faqs/FaqPreviewList";
import { TourDetailsGallery } from "@/components/tours/TourDetailsGallery";
import { TourDetailsHero } from "@/components/tours/TourDetailsHero";
import { TourDetailsInclusions } from "@/components/tours/TourDetailsInclusions";
import { TourDetailsItinerary } from "@/components/tours/TourDetailsItinerary";
import { TourDetailsOverview } from "@/components/tours/TourDetailsOverview";
import { TourDetailsReviews } from "@/components/tours/TourDetailsReviews";
import { TourDetailsSidebar } from "@/components/tours/TourDetailsSidebar";
import { TourDetailsTabs } from "@/components/tours/TourDetailsTabs";
import { TourDetailsFitCheck } from "@/components/tours/TourDetailsFitCheck";
import { TourDetailsHighlights } from "@/components/tours/TourDetailsHighlights";
import { TourDetailsAccommodation } from "@/components/tours/TourDetailsAccommodation";
import { TourDetailsMealsTransport } from "@/components/tours/TourDetailsMealsTransport";
import { TourDetailsBudget } from "@/components/tours/TourDetailsBudget";
import { TourDetailsTravelInfo } from "@/components/tours/TourDetailsTravelInfo";
import { TourDetailsRelatedTours } from "@/components/tours/TourDetailsRelatedTours";
import { TourCustomizationBanner } from "@/components/tours/TourCustomizationBanner";
import { TransportAssistanceBanner } from "@/components/tours/TransportAssistanceBanner";
import { ActivitiesShowcase } from "@/components/activities/ActivitiesShowcase";
import { AffordabilityWidget } from "@/components/payments/AffordabilityWidget";
import { BookingMobileBar } from "@/components/tours/BookingMobileBar";
import { PackageViewTracker } from "@/components/analytics/PackageViewTracker";
import { ScrollToTopOnMount } from "@/components/layout/ScrollToTopOnMount";
import { TrustSection } from "@/components/common/TrustSection";
import { TourPackageCards } from "@/components/tours/TourPackageCards";
import { KASHMIR_SITE_REGIONS } from "@/lib/tours/regions";
import { pickPrimaryCollection } from "@/lib/tours/collections";
import {
  parseJson,
  parseItinerary,
  parseStringList,
  parseAccommodation,
  parseBudgetRows,
  parsePersonalExpenses,
  parsePackingList,
  parseImportantNotes,
  parseRelatedTours,
  publishedPackageOptions,
} from "@/lib/tours/content";
import { contextAttrs, trimTourTitle } from "@/lib/leads/qualification";
import { FAQ_PREVIEW_SELECT, toFaqPreview } from "@/lib/faqs";

// 24h safety net — Tour mutations invalidate this exact page directly (src/lib/cache.ts).
export const revalidate = 86400;

// Without this, Next.js has no known slug list to pre-render and falls back
// to fully dynamic rendering on every request regardless of `revalidate`
// (confirmed via build output: this route stayed ƒ even after ISR was
// restored on the rest of the public site). The catalog is small (single
// digits), so pre-rendering all of them at build time is cheap; any tour
// added after a deploy is rendered on its first request and cached from then on.
export async function generateStaticParams() {
  const tours = await prisma.tour.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return tours.map((t) => ({ slug: t.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

const CATEGORY_LABEL: Record<string, string> = {
  HONEYMOON: "Honeymoon",
  FAMILY: "Family",
  ADVENTURE: "Adventure",
  LUXURY: "Luxury",
  BUDGET: "Budget",
  GROUP: "Group",
  PILGRIMAGE: "Pilgrimage",
  PREMIUM: "Premium",
};

const BADGE_COLORS = ["orange", "blue", "green"] as const;

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getTour = cache(async (slug: string) => {
  return prisma.tour.findFirst({
    where: { slug, published: true },
    include: {
      destinations: { include: { destination: { select: { name: true } } } },
      reviews: {
        where: { approved: true },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { user: { select: { image: true } } },
      },
      // Published activities linked to this tour → "Things to Do".
      activities: {
        where: { activity: { published: true } },
        include: {
          activity: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              coverImage: true,
              duration: true,
            },
          },
        },
      },
      // Tour Collections — the primary (lowest sortOrder, published) one is
      // this page's breadcrumb parent. The tour's URL never depends on them.
      collections: {
        where: { published: true },
        select: { name: true, slug: true, sortOrder: true, published: true },
      },
      // Centralized FAQ module.
      relatedFaqs: {
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        select: { ...FAQ_PREVIEW_SELECT, mentionsPrice: true },
      },
    },
  });
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getTour(slug);

  if (!tour) {
    return buildMetadata({
      title: "Tour Not Found",
      description: "The Kashmir tour package you are looking for could not be found.",
      canonical: `${SITE_URL}/tours/${slug}`,
      noindex: true,
    });
  }

  return buildMetadata({
    title: tour.metaTitle ?? tour.title,
    description:
      tour.metaDesc ??
      tour.excerpt ??
      tour.description ??
      `${tour.title} — a curated Kashmir tour package by Vertex Kashmir Holidays.`,
    canonical: `${SITE_URL}/tours/${slug}`,
    ogImage: tour.ogImage ?? tour.coverImage ?? null,
    ogTitle: tour.ogTitle,
    ogDescription: tour.ogDescription,
  });
}

export default async function TourDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const [tour, settings] = await Promise.all([getTour(slug), getSiteSettings()]);

  if (!tour) notFound();

  // ── Parse JSON fields ──────────────────────────────────────────────────────
  type GalleryItem = { url: string; alt: string };
  const gallery: GalleryItem[] = parseJson<unknown[]>(tour.gallery, []).map((item) =>
    typeof item === "string" ? { url: item, alt: "" } : (item as GalleryItem),
  );
  const inclusions = parseStringList(tour.inclusions);
  const exclusions = parseStringList(tour.exclusions);
  const highlights = parseStringList(tour.highlights);
  // Only shortAnswer is ever selected/rendered here; the full answer is on /faq.
  // Price on request (Tour.hidePrice): no price anywhere on the page, the
  // tour is enquiry-only, and FAQs tagged "About price" are left out (they
  // refer to a price the visitor can't see) — page and FAQPage schema alike.
  const priceHidden = tour.hidePrice;
  const formMode = effectiveFormMode(tour);
  const faqs = tour.relatedFaqs
    .filter((f) => !(priceHidden && f.mentionsPrice))
    .map(toFaqPreview);
  const batches = parseJson<{ date: string; seats: number; price: string; status: string }[]>(
    tour.batches,
    [],
  ).map((b) => (priceHidden ? { ...b, price: "" } : b));
  // Real, admin-entered scarcity — already captured for Event schema, now also
  // surfaced to visitors. Only ever shown when a staff member has actually
  // marked a departure "filling"; never fabricated.
  const today = new Date().toISOString().split("T")[0];
  const nextDeparture =
    batches.filter((b) => b.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const rawItinerary = parseItinerary(tour.itinerary);

  const perfectFor = parseStringList(tour.perfectFor);
  const notIdealFor = parseStringList(tour.notIdealFor);
  const accommodation = parseAccommodation(tour.accommodation);
  const budgetBreakdown = parseBudgetRows(tour.budgetBreakdown);
  // The breakdown leads with the price — hidden on price-on-request tours
  // (Personal Expenses, which carries no package price, still shows).
  const visibleBudgetBreakdown = tour.hidePrice ? [] : budgetBreakdown;
  const personalExpenses = parsePersonalExpenses(tour.personalExpenses);
  const thingsToCarry = parsePackingList(tour.thingsToCarry);
  const localTravelTips = parseStringList(tour.localTravelTips);
  const importantNotes = parseImportantNotes(tour.importantNotes);
  const relatedTourEntries = parseRelatedTours(tour.relatedTours);
  // Package variants (Tour.packageOptions) — shared itinerary, per-package
  // stay/services and a public 2-person price. Empty for ordinary tours, in
  // which case this page renders exactly as before.
  const packageOptions = publishedPackageOptions(tour.packageOptions).map((o) =>
    priceHidden ? { ...o, priceForTwo: 0 } : o,
  );
  const lowestPriceForTwo =
    packageOptions.length && !priceHidden
      ? Math.min(...packageOptions.map((o) => o.priceForTwo))
      : null;
  // Kashmir/Ladakh-specific blocks (flight/train-to-Srinagar help, Kashmir
  // trust copy) are skipped for other regions (e.g. Himachal).
  const isKashmirSite = KASHMIR_SITE_REGIONS.includes(tour.region);
  const primaryCollection = pickPrimaryCollection(tour.collections);

  const itinerary = rawItinerary.map((d) => ({
    day: d.day,
    title: d.title,
    body: d.description ?? "",
    image: d.image,
    meals: d.meals,
    stay: d.stay,
    travelTips: d.travelTips,
  }));

  // ── Related tours (curated, editorial pairings) ────────────────────────────
  const relatedTourRows =
    relatedTourEntries.length > 0
      ? await prisma.tour.findMany({
          where: { id: { in: relatedTourEntries.map((r) => r.tourId) }, published: true },
          include: { destinations: { include: { destination: { select: { name: true } } } } },
        })
      : [];
  const relatedTourById = new Map(relatedTourRows.map((t) => [t.id, t]));
  const relatedTours = relatedTourEntries
    .map((entry) => {
      const t = relatedTourById.get(entry.tourId);
      if (!t) return null;
      return {
        ctaSentence: entry.ctaSentence,
        tour: {
          badge: t.badge ?? CATEGORY_LABEL[t.category] ?? "Tour",
          bc: (BADGE_COLORS as readonly string[]).includes(t.badgeColor ?? "")
            ? (t.badgeColor as (typeof BADGE_COLORS)[number])
            : ("green" as const),
          category: t.category,
          image: t.coverImage ?? undefined,
          detailHref: `/tours/${t.slug}`,
          bookHref: `/booking?tour=${t.slug}`,
          t: t.title,
          d: `${Math.max(t.duration - 1, 0)}N / ${t.duration}D`,
          places: t.destinations.map((d) => d.destination.name).join(", "),
          r: t.rating.toFixed(1),
          n: String(t.reviewCount),
          ...tourCardPricing(t),
        },
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // ── Derived display values ─────────────────────────────────────────────────
  const categoryLabel = CATEGORY_LABEL[tour.category] ?? "Tour";
  const nights = Math.max(tour.duration - 1, 0);
  const durationLabel = `${nights}N / ${tour.duration}D`;
  const heroImages = [tour.coverImage, ...gallery.map((g) => g.url)].filter((img): img is string =>
    Boolean(img),
  );

  const happyLabel =
    tour.happyCount && tour.happyCount > 0
      ? `${tour.happyCount.toLocaleString()}+ Happy ${
          tour.category === "HONEYMOON" ? "Couples" : "Travellers"
        }`
      : "";

  const reviews = tour.reviews.map((r) => ({
    seed: r.id,
    name: r.name,
    // Per-review picture wins, then the reviewer's profile picture; null falls
    // back to a deterministic placeholder in the component.
    avatar: r.avatar ?? r.user?.image ?? null,
    meta: `${r.createdAt.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    })} · Verified Booking`,
    quote: r.body,
  }));

  // Things to Do — driven by the Activities module (published, linked to this tour).
  const things = tour.activities.map((a) => ({
    id: a.activity.id,
    image: a.activity.coverImage,
    title: a.activity.name,
    description: a.activity.description ?? "",
    duration: a.activity.duration,
    href: `/activities/${a.activity.slug}`,
  }));

  // ── Tabs (only for sections that have content) ─────────────────────────────
  // Shortened to the core sections — Meals & Transport, Travel Info, Trip Fit,
  // FAQs and Related Tours are still rendered on the page, just no longer
  // have their own quick-nav tab (this bar is a scroll-spy anchor nav, not a
  // content switcher — see TourDetailsTabs.tsx).
  const tabs = [
    { id: "overview", label: "Overview" },
    ...(itinerary.length ? [{ id: "itinerary", label: "Itinerary" }] : []),
    ...(packageOptions.length ? [{ id: "packages", label: "Packages" }] : []),
    ...(highlights.length ? [{ id: "highlights", label: "Highlights" }] : []),
    ...(inclusions.length || exclusions.length ? [{ id: "inclusions", label: "Inclusions" }] : []),
    ...(things.length ? [{ id: "things", label: "Things to Do" }] : []),
    ...(accommodation.length ? [{ id: "accommodation", label: "Accommodation" }] : []),
    ...(visibleBudgetBreakdown.length || personalExpenses.length
      ? [{ id: "budget", label: "Budget" }]
      : []),
    ...(gallery.length ? [{ id: "gallery", label: "Gallery" }] : []),
    ...(reviews.length ? [{ id: "reviews", label: "Reviews" }] : []),
  ];

  // ── Structured data (JSON-LD) ──────────────────────────────────────────────
  const TOURIST_TYPE: Record<string, string[]> = {
    HONEYMOON: ["Couples", "Honeymoon"],
    FAMILY: ["Family", "Families with children"],
    ADVENTURE: ["Adventure travelers", "Backpackers"],
    LUXURY: ["Luxury travelers"],
  };

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Tours", url: `${SITE_URL}/tours` },
    ...(primaryCollection
      ? [{ name: primaryCollection.name, url: `${SITE_URL}/${primaryCollection.slug}` }]
      : []),
    { name: tour.title, url: `${SITE_URL}/tours/${tour.slug}` },
  ]);

  const productJsonLd = buildProduct({
    title: tour.title,
    slug: tour.slug,
    description: tour.excerpt ?? tour.description,
    coverImage: tour.coverImage,
    // Package tours show "From ₹X / 2 persons" — the offer matches that
    // visible price rather than the derived per-person priceFrom. Price on
    // request: null → no offers block at all.
    priceFrom: priceHidden ? null : (lowestPriceForTwo ?? tour.priceFrom),
  });

  const eventLds =
    batches.length > 0
      ? buildCampaignEvents({
          name: tour.title,
          slug: tour.slug,
          heroImage: tour.coverImage,
          batches,
        })
      : [];

  const touristTripJsonLd = buildTouristTrip({
    title: tour.title,
    slug: tour.slug,
    description: tour.excerpt ?? tour.description,
    coverImage: tour.coverImage,
    duration: tour.duration,
    priceFrom: priceHidden ? null : (lowestPriceForTwo ?? tour.priceFrom),
    touristType: TOURIST_TYPE[tour.category] ?? "General",
    itineraryItems: rawItinerary.map((d) => ({ position: d.day, name: d.title })),
  });

  // Lead-qualification context for this page's own WhatsApp CTAs: this tour,
  // priced per person (a package-option tour: its lowest option ÷ 2). The site
  // header/footer/floating button sit outside this wrapper and stay generic.
  const waContext = priceHidden
    ? contextAttrs({ kind: "generic" })
    : contextAttrs({
        kind: "tour",
        pricePerPerson: lowestPriceForTwo !== null ? lowestPriceForTwo / 2 : tour.priceFrom,
        name: trimTourTitle(tour.title),
      });

  return (
    <div className="bg-background text-foreground" {...waContext}>
      <ScrollToTopOnMount />
      <PackageViewTracker packageName={tour.title} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={productJsonLd} />
      <JsonLd data={touristTripJsonLd} />
      {eventLds.map((ev, i) => (
        <JsonLd key={i} data={ev} />
      ))}
      {/* Short answer only — matches what's actually rendered on this page;
         the full answer's schema lives on each FAQ's own /faq/[slug] page. */}
      {faqs.length > 0 && (
        <JsonLd
          data={buildFAQPage(faqs.map((f) => ({ question: f.question, answer: f.shortAnswer })))}
        />
      )}

      <TourDetailsHero
        tourName={tour.title}
        duration={durationLabel}
        nights={nights}
        days={tour.duration}
        category={categoryLabel}
        transport={tour.transport ?? "Private Cab"}
        startCity={tour.startCity ?? (isKashmirSite ? "Srinagar" : "On request")}
        difficulty={tour.difficulty ?? "Easy"}
        tagline={tour.tagline ?? tour.excerpt ?? ""}
        badge={tour.badge ?? categoryLabel}
        badgeColor={
          (BADGE_COLORS as readonly string[]).includes(tour.badgeColor ?? "")
            ? (tour.badgeColor as (typeof BADGE_COLORS)[number])
            : "green"
        }
        rating={tour.rating}
        reviews={tour.reviewCount}
        happyLabel={happyLabel}
        images={heroImages}
        coverImageMobile={tour.coverImageMobile ?? undefined}
        breadcrumbParent={
          primaryCollection
            ? { name: primaryCollection.name, href: `/${primaryCollection.slug}` }
            : undefined
        }
      />

      <main className="mx-auto max-w-[1300px] px-3 sm:px-6 pt-3 sm:pt-6 pb-28 lg:pb-6">
        <TourDetailsTabs sections={tabs} />

        <div className="mt-6">
          <TourCustomizationBanner tourName={tour.title} />
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <section id="overview">
              <TourDetailsOverview
                description={tour.description ?? tour.excerpt ?? ""}
                whyItineraryWorks={tour.whyItineraryWorks ?? undefined}
              />
            </section>

            {itinerary.length > 0 && (
              <section id="itinerary" className="scroll-mt-16">
                <TourDetailsItinerary itinerary={itinerary} />
              </section>
            )}

            {packageOptions.length > 0 && (
              <section id="packages" className="scroll-mt-16">
                <TourPackageCards
                  tourId={tour.id}
                  tourName={tour.title}
                  options={packageOptions}
                  priceHidden={priceHidden}
                />
              </section>
            )}

            {/* Positive follow-through right after the itinerary is understood —
               the honest "Airfare — Excluded" messaging still lives in
               Inclusions/Exclusions below, unchanged. Kashmir/Ladakh only —
               its copy and fare help are Srinagar/Leh-specific. */}
            {isKashmirSite && (
              <TransportAssistanceBanner
                placement="tour-detail"
                tourId={tour.id}
                tourName={tour.title}
              />
            )}

            <div className="scroll-mt-16">
              <TourDetailsHighlights highlights={highlights} />
            </div>

            {(inclusions.length > 0 || exclusions.length > 0) && (
              <section id="inclusions" className="scroll-mt-16">
                <TourDetailsInclusions inclusions={inclusions} exclusions={exclusions} />
              </section>
            )}

            {things.length > 0 && (
              <section id="things" className="scroll-mt-16 mt-6">
                <ActivitiesShowcase
                  title={`Things to Do on This Tour`}
                  items={things}
                  seeAllHref="/activities"
                  trackPlacement="tour_detail"
                />
              </section>
            )}

            <div className="scroll-mt-16">
              <TourDetailsAccommodation
                accommodation={accommodation}
                image={tour.accommodationImage ?? tour.coverImage ?? undefined}
                tourTitle={tour.title}
              />
            </div>

            <div className="scroll-mt-16">
              <TourDetailsMealsTransport
                meals={tour.meals ?? undefined}
                transportDetail={tour.transportDetail ?? undefined}
              />
            </div>

            <div className="scroll-mt-16">
              <TourDetailsTravelInfo
                bestTimeDetail={tour.bestTimeDetail ?? undefined}
                thingsToCarry={thingsToCarry}
                localTravelTips={localTravelTips}
                importantNotes={importantNotes}
              />
            </div>

            <div className="scroll-mt-16">
              <TourDetailsFitCheck perfectFor={perfectFor} notIdealFor={notIdealFor} />
            </div>

            {faqs.length > 0 && (
              <section
                id="faqs"
                className="scroll-mt-16 mt-6 rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
              >
                <h2 className="text-[18px] font-bold">FAQs</h2>
                <div className="mt-4">
                  <FaqPreviewList faqs={faqs} />
                </div>
              </section>
            )}

            <div className="scroll-mt-16">
              <TourDetailsBudget
                budgetBreakdown={visibleBudgetBreakdown}
                personalExpenses={personalExpenses}
              />
            </div>

            {gallery.length > 0 && (
              <section id="gallery" className="scroll-mt-16">
                <TourDetailsGallery images={gallery} />
              </section>
            )}

            {reviews.length > 0 && (
              <section id="reviews" className="scroll-mt-16">
                <TourDetailsReviews reviews={reviews} totalReviews={tour.reviewCount} />
              </section>
            )}

            <div className="scroll-mt-16">
              <TourDetailsRelatedTours
                relatedTours={relatedTours}
                whyVertexBlurb={tour.whyVertexBlurb ?? undefined}
                ctaHeadline={tour.ctaHeadline ?? undefined}
                ctaBody={tour.ctaBody ?? undefined}
                tourName={tour.title}
                tourSlug={tour.slug}
                formMode={formMode}
                priceHidden={priceHidden}
              />
            </div>
          </div>

          <div className="space-y-5">
            {/* EMI on a per-person price doesn't apply to package tours (enquiry only). */}
            {lowestPriceForTwo === null && !priceHidden && (
              <AffordabilityWidget amount={tour.priceFrom} />
            )}
            <TourDetailsSidebar
              priceHidden={priceHidden}
              price={priceHidden ? 0 : (lowestPriceForTwo ?? tour.priceFrom)}
              pricePrefix={lowestPriceForTwo !== null ? "From" : undefined}
              priceSuffix={lowestPriceForTwo !== null ? "/ 2 persons" : undefined}
              oldPrice={
                lowestPriceForTwo === null && !priceHidden ? (tour.priceWas ?? undefined) : undefined
              }
              discountPct={
                lowestPriceForTwo === null && !priceHidden
                  ? (tour.discountPct ?? undefined)
                  : undefined
              }
              minPersons={tour.minPersons}
              rating={tour.rating}
              reviews={tour.reviewCount}
              tourId={tour.id}
              tourName={tour.title}
              tourSlug={tour.slug}
              formMode={formMode}
              nextDeparture={nextDeparture}
              bestTime={tour.bestTime ?? "Apr – Oct"}
              tourType={tour.tourType ?? "Private Tour"}
              pickupDrop={
                tour.pickupDrop ??
                (isKashmirSite ? `${tour.startCity ?? "Srinagar"} Airport` : "On request")
              }
              helpPhone={settings?.sitePhone ?? "+91 94190 00000"}
            />
          </div>
        </div>
      </main>

      {/* Mobile-only sticky Book / Inquiry CTAs (forms open in a bottom-sheet). */}
      <BookingMobileBar
        formMode={formMode}
        priceHidden={priceHidden}
        tourId={tour.id}
        tourName={tour.title}
        tourSlug={tour.slug}
        price={priceHidden ? 0 : tour.priceFrom}
        oldPrice={priceHidden ? undefined : (tour.priceWas ?? undefined)}
        discountPct={priceHidden ? undefined : (tour.discountPct ?? undefined)}
        minPersons={tour.minPersons}
      />

      <TrustSection type={isKashmirSite ? "tour" : "tour-general"} name={tour.title} />
    </div>
  );
}
