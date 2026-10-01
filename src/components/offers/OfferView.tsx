import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import {
  JsonLd,
  buildBreadcrumbList,
  buildFAQPage,
  buildOccasionOfferTrip,
  buildWebPage,
} from "@/components/seo/JsonLd";
import { formatINR } from "@/lib/accents";
import { parseJson, parseStringList } from "@/lib/tours/content";
import {
  OCCASION_LABELS,
  defaultOfferCta,
  formatOfferDates,
  isOfferCurrent,
  parseCompareRows,
  parseOfferActivities,
  parseOfferFaqs,
  parseOfferItinerary,
  parseOfferPoints,
  parseOfferStays,
} from "@/lib/offers/content";
import {
  getLiveOccasionOffers,
  getOfferDestinations,
  getOfferPage,
  type OfferPageData,
} from "@/lib/offers/queries";
import { buildOfferView } from "@/lib/offers/view";
import { getLiveTourCollections } from "@/lib/tours/collectionQueries";
import { getPublicHeroStats } from "@/lib/publicHeroStats";
import { getApprovedReviewsPage, getReviewStats } from "@/lib/reviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { VideoReviewsSection } from "@/components/home/VideoReviewsSection";
import { TourCategoryHubWhyChoose } from "@/components/tours/TourCategoryHubWhyChoose";
import { TrustSection } from "@/components/common/TrustSection";
import { OfferSelectionProvider, type OfferClientInfo } from "./OfferSelection";
import { OfferHero } from "./OfferHero";
import { OfferSectionNav, type OfferNavItem } from "./OfferSectionNav";
import { OfferPlans } from "./OfferPlans";
import { OfferCompare } from "./OfferCompare";
import { OfferItinerary } from "./OfferItinerary";
import { OfferStays } from "./OfferStays";
import { OfferClosingCta, OfferEnquiryModal } from "./OfferEnquiry";
import { OfferMobileBar } from "./OfferMobileBar";
import { OfferViewTracker } from "./OfferViewTracker";
import { OfferCard } from "./OfferCard";
import { OfferActivities } from "./OfferActivities";
import { OfferBannerSlot } from "./OfferBannerSlot";
import { getBannersForPage, toPromoBannerData } from "@/lib/banners";
import { OfferCustomizeNote } from "./OfferCustomizeNote";
import {
  OfferFaqList,
  OfferInclusions,
  OfferLinks,
  OfferMedia,
  OfferOverview,
  OfferRoute,
  OfferSection,
  OfferWhyThisSeason,
  type OfferLink,
} from "./OfferSections";

// One reusable page for every Occasion Offer (/offers/diwali-kashmir-tour-package-2026,
// /offers/christmas-kashmir-tour-package-2026, …). Everything that varies —
// copy, dates, route, plans, stays, prices, photos, FAQs — comes from the
// OccasionOffer row and the Destination records it references; nothing here is
// specific to one occasion. Unpublished offers never reach this component
// (getOfferPage filters on published).
//
// Once the end date passes the page stays up (backlinks, search) but is no
// longer bookable: noindex, a "this offer ran …" notice in the hero, and no
// plans/prices, enquiry CTAs, add-on activities, mobile bar or enquiry modal.
// The trip content — overview, route, itinerary, stays, inclusions, FAQs —
// stays, and the "More Seasonal Offers" strip points at current ones.

const KASHMIR_COLLECTION_SLUG = "kashmir-tour-packages";

export const offerUrl = (slug: string) => `${SITE_URL}/offers/${slug}`;

function offerDescription(o: OfferPageData): string {
  if (o.metaDesc) return o.metaDesc;
  if (o.shortDescription) return o.shortDescription;
  const fromPrice = o.packages.length ? Math.min(...o.packages.map((p) => p.priceForTwo)) : null;
  return [
    o.name,
    formatOfferDates(o.startDate, o.endDate),
    fromPrice !== null ? `packages from ${formatINR(fromPrice)} for 2 adults` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function occasionOfferMetadata(slug: string): Promise<Metadata> {
  const o = await getOfferPage(slug);
  if (!o) return buildMetadata({ title: "Offer Not Found", description: "", noindex: true });
  return buildMetadata({
    title: o.metaTitle || o.name,
    description: offerDescription(o),
    canonical: o.canonicalUrl || offerUrl(o.slug),
    ogTitle: o.ogTitle || null,
    ogDescription: o.ogDesc || null,
    ogImage: o.ogImage || o.heroImage || null,
    noindex: o.noindex || !isOfferCurrent(o.endDate),
  });
}

export async function OccasionOfferView({ slug }: { slug: string }) {
  const o = await getOfferPage(slug);
  if (!o) notFound();

  const destinationSlugs = [
    ...parseOfferItinerary(o.itinerary).map((d) => d.destination),
    ...o.packages.flatMap((p) => parseOfferStays(p.stays).map((s) => s.destination)),
  ];
  const [
    destinations,
    stats,
    reviews,
    reviewStats,
    videos,
    liveOffers,
    collections,
    bannersAfterPlans,
    bannersAfterItinerary,
  ] = await Promise.all([
    getOfferDestinations(destinationSlugs),
    getPublicHeroStats(),
    getApprovedReviewsPage({ page: 1, perPage: 3 }),
    getReviewStats(),
    prisma.videoReview.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getLiveOccasionOffers(),
    getLiveTourCollections(),
    // Admin → Banners → "Offer pages — …" slots (e.g. transport options).
    getBannersForPage("offer-after-plans"),
    getBannersForPage("offer-after-itinerary"),
  ]);
  const view = buildOfferView(
    o,
    destinations.map(({ coverImage, topAttractions, ...d }) => ({
      ...d,
      image: coverImage,
      attractions: parseJson<{ name: string }[]>(topAttractions, [])
        .map((a) => a.name)
        .filter(Boolean),
    })),
  );

  const url = offerUrl(o.slug);
  const occasionLabel = OCCASION_LABELS[o.occasionType];
  const title = o.heroTitle || o.name;
  const description = offerDescription(o);
  const faqs = parseOfferFaqs(o.faqs);
  const whyPoints = parseOfferPoints(o.whyThisOffer);
  const inclusions = parseStringList(o.inclusions);
  const exclusions = parseStringList(o.exclusions);
  const gallery = parseStringList(o.gallery);
  const activities = parseOfferActivities(o.activities);
  const otherOffers = liveOffers.filter((x) => x.slug !== o.slug).slice(0, 3);
  const isGeneric = o.occasionType === "OTHER";
  const ended = !isOfferCurrent(o.endDate);

  const offerInfo: OfferClientInfo = {
    offerId: o.id,
    offerSlug: o.slug,
    name: o.name,
    dates: view.dates,
    occasionType: o.occasionType,
    ctaLabel: o.ctaLabel || defaultOfferCta(o.occasionType),
  };

  const kashmirCollection = collections.find((c) => c.slug === KASHMIR_COLLECTION_SLUG);
  const links: OfferLink[] = [
    ...o.relatedTours.map((t) => ({ href: `/tours/${t.slug}`, label: t.title })),
    ...(kashmirCollection
      ? [{ href: `/${kashmirCollection.slug}`, label: kashmirCollection.name }]
      : [{ href: "/tours", label: "All Tour Packages" }]),
    { href: "/plan-your-kashmir-trip", label: "Plan a Custom Trip" },
    { href: "/blog", label: "Kashmir Travel Stories" },
  ];

  // Sticky section nav — only sections this offer actually renders.
  const nav: OfferNavItem[] = [
    ...(view.plans.length && !ended ? [{ id: "plans", label: "Packages & Prices" }] : []),
    ...(view.days.length ? [{ id: "itinerary", label: "Itinerary" }] : []),
    ...(view.plans.some((p) => p.stays.length) ? [{ id: "stays", label: "Stays" }] : []),
    ...(activities.length && !ended ? [{ id: "activities", label: "Activities" }] : []),
    ...(inclusions.length || exclusions.length ? [{ id: "inclusions", label: "Inclusions" }] : []),
    ...(reviews.items.length ? [{ id: "reviews", label: "Reviews" }] : []),
    ...(faqs.length ? [{ id: "faqs", label: "FAQs" }] : []),
  ];

  return (
    <OfferSelectionProvider offer={offerInfo} defaultPlan={view.plans[0]?.name ?? null}>
      <div className={`bg-background text-foreground ${ended ? "" : "pb-24 lg:pb-0"}`}>
        <JsonLd
          data={buildBreadcrumbList([
            { name: "Home", url: SITE_URL },
            { name: "Offers", url: `${SITE_URL}/offers` },
            { name: o.name, url },
          ])}
        />
        <JsonLd data={buildWebPage({ name: title, description, url, image: o.heroImage })} />
        {view.plans.length > 0 && !ended && (
          <JsonLd
            data={buildOccasionOfferTrip({
              name: o.name,
              description,
              url,
              image: o.heroImage,
              itineraryDays: view.days.map((d) => d.title),
              tiers: view.plans,
            })}
          />
        )}
        {faqs.length > 0 && <JsonLd data={buildFAQPage(faqs)} />}
        <OfferViewTracker />

        <OfferHero
          title={title}
          subtitle={o.heroSubtitle}
          occasionLabel={occasionLabel}
          occasionType={o.occasionType}
          duration={view.duration}
          routeLabel={view.route.map((r) => r.name).join(" · ") || null}
          heroImage={o.heroImage}
          heroImageMobile={o.heroImageMobile}
          plans={ended ? [] : view.plans}
          stats={stats}
          ended={ended}
        />
        {nav.length > 1 && <OfferSectionNav items={nav} showEnquiry={!ended} />}

        {/* No bottom padding — the video stories section below brings its own. */}
        <div className="mx-auto max-w-[1300px] space-y-14 px-4 pt-10 sm:space-y-20 sm:px-6 sm:pt-20">
          {(o.shortDescription || o.overview) && (
            <OfferOverview lead={o.shortDescription} html={o.overview} />
          )}

          {view.route.length > 0 && (
            <OfferSection
              id="route"
              kicker="The route"
              title={`${view.route.length} Places${view.duration ? ` · ${view.duration}` : ""}`}
            >
              {!ended && <OfferCustomizeNote />}
              <OfferRoute stops={view.route} />
            </OfferSection>
          )}
        </div>

        {videos.length > 0 && (
          <VideoReviewsSection
            heading={{
              kicker: "Video stories",
              title: "Hear It From Our Guests",
              subtitle: null,
              ctaLabel: null,
              ctaHref: null,
            }}
            videos={videos.map((v) => ({
              id: v.id,
              name: v.name,
              place: v.place,
              duration: v.duration,
              thumbnail: v.thumbnail,
              videoUrl: v.videoUrl,
            }))}
          />
        )}

        <div className="mx-auto max-w-[1300px] space-y-14 px-4 py-10 sm:space-y-20 sm:px-6 sm:py-20">
          {view.plans.length > 0 && !ended && (
            <OfferSection
              id="plans"
              kicker="Packages & prices"
              title="Choose Your Package"
              intro="Same dates, same route and sightseeing — the packages differ in where you sleep. Every price is the total for 2 adults."
            >
              <OfferPlans plans={view.plans} />
              {view.plans.length > 1 && (
                <div className="mt-10">
                  <h3 className="mb-4 text-[20px] font-bold text-foreground">Compare Packages</h3>
                  <OfferCompare
                    plans={view.plans}
                    places={view.places}
                    compareRows={parseCompareRows(o.compareRows)}
                  />
                </div>
              )}
            </OfferSection>
          )}

          <OfferBannerSlot banners={toPromoBannerData(bannersAfterPlans)} />

          {view.days.length > 0 && (
            <OfferSection
              id="itinerary"
              kicker={view.dates ?? "Day by day"}
              title="Day-by-Day Itinerary"
            >
              <OfferItinerary days={view.days} plans={view.plans} />
            </OfferSection>
          )}

          <OfferBannerSlot banners={toPromoBannerData(bannersAfterItinerary)} />

          {view.plans.some((p) => p.stays.length) && (
            <OfferSection id="stays" kicker="Where you'll stay" title="Your Stays, Night by Night">
              <OfferStays plans={view.plans} />
            </OfferSection>
          )}

          {activities.length > 0 && !ended && (
            <OfferSection
              id="activities"
              kicker="Optional activities"
              title={o.activitiesTitle || "Add-On Activities"}
              intro={
                o.activitiesIntro ||
                "Not part of the package price — add any of these to your package and we'll book them for you."
              }
            >
              <OfferActivities activities={activities} note={o.activitiesNote} />
            </OfferSection>
          )}

          {whyPoints.length > 0 && (
            <OfferSection
              id="why"
              kicker={isGeneric ? "Why book" : `Why this ${occasionLabel}`}
              title={isGeneric ? "Why Book This Offer" : `Why Kashmir This ${occasionLabel}`}
            >
              <OfferWhyThisSeason points={whyPoints} />
            </OfferSection>
          )}

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <OfferSection id="inclusions" kicker="What's covered" title="Inclusions & Exclusions">
              <OfferInclusions inclusions={inclusions} exclusions={exclusions} />
            </OfferSection>
          )}

          {(o.filmUrl || gallery.length > 0) && (
            <OfferSection id="gallery" kicker="See it" title="Kashmir, Up Close">
              <OfferMedia
                filmUrl={o.filmUrl}
                filmPoster={o.filmPoster}
                gallery={gallery}
                alt={o.name}
              />
            </OfferSection>
          )}

          {reviews.items.length > 0 && (
            <OfferSection
              id="reviews"
              kicker="Traveller reviews"
              title="Travellers Who Went With Us"
              intro={
                reviewStats.total > 0
                  ? `Rated ${reviewStats.average.toFixed(1)}/5 across ${reviewStats.total} reviews.`
                  : undefined
              }
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.items.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </OfferSection>
          )}
          {faqs.length > 0 && (
            <OfferSection
              id="faqs"
              kicker="Good to know"
              title={isGeneric ? "Frequently Asked Questions" : `${occasionLabel} Trip FAQs`}
            >
              <OfferFaqList faqs={faqs} />
            </OfferSection>
          )}

          {!ended && <OfferClosingCta fromPrice={view.fromPrice} />}

          <TourCategoryHubWhyChoose variant="kashmir" />

          {otherOffers.length > 0 && (
            <OfferSection id="more-offers" kicker="Seasonal offers" title="More Seasonal Offers">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {otherOffers.map((x) => (
                  <OfferCard key={x.slug} offer={x} />
                ))}
              </div>
            </OfferSection>
          )}

          <section aria-label="Keep exploring">
            <h2 className="mb-3 text-[18px] font-bold text-foreground">Keep Exploring</h2>
            <OfferLinks links={links} />
          </section>
        </div>

        <TrustSection type="category" />
        {!ended && (
          <>
            <OfferMobileBar />
            <OfferEnquiryModal plans={view.plans} duration={view.duration} />
          </>
        )}
      </div>
    </OfferSelectionProvider>
  );
}
