import type { Metadata } from "next";
import type { Banner } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { formatINR } from "@/lib/accents";
import { SecondaryHero } from "@/components/layout/SecondaryHero";
import { HeroStats } from "@/components/layout/HeroStats";
import { TripPlannerForm } from "@/components/leads/TripPlannerForm";
import { HeroWhatsAppCta } from "@/components/leads/HeroWhatsAppCta";
import { TripPlannerHowItWorks } from "@/components/leads/TripPlannerHowItWorks";
import { TripPlannerHotelCarousel } from "@/components/leads/TripPlannerHotelCarousel";
import { TripPlannerMobileBar } from "@/components/leads/TripPlannerMobileBar";
import { WhyChooseSection } from "@/components/home/WhyChooseSection";
import { PackagesSection } from "@/components/home/PackagesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FaqPreviewList } from "@/components/faqs/FaqPreviewList";
import { TrustSection } from "@/components/common/TrustSection";
import { PromoBanner, type PromoBannerData } from "@/components/public/PromoBanner";
import { getBannersForPage } from "@/lib/banners";
import { getFaqsForPlacement } from "@/lib/faqs";
import { getDisplayReviews } from "@/lib/reviews";
import { getPublicHotels } from "@/lib/hotelSuppliers/stats";
import { getTripPlannerContent } from "@/lib/tripPlannerContent";
import { getPublicHeroStats } from "@/lib/publicHeroStats";

// ISR, same as every other public content page (Tours, Destinations, …) —
// this page reads no per-request data (no cookies()/headers()), so it stays
// eligible for static rendering + periodic revalidation rather than forcing
// a dynamic render on every request.
export const revalidate = 300;

// Banner and PromoBannerData already share every field name 1:1 — this just
// narrows to the subset PromoBannerCard actually reads.
function toPromoBannerData(banners: Banner[]): PromoBannerData[] {
  return banners.map((b) => ({
    id: b.id,
    title: b.title,
    body: b.body,
    ctaLabel: b.ctaLabel,
    ctaUrl: b.ctaUrl,
    imageUrl: b.imageUrl,
    imageMobileUrl: b.imageMobileUrl,
  }));
}

// Keyword-aligned defaults (Google Ads: "kashmir packages" / "kashmir trip
// package" / "kashmir tour" / "kashmir tour packages" / "kashmir tourism
// package" / "kashmir tour package price") — used whenever the admin-editable
// TripPlannerContent singleton (src/app/admin/trip-planner) hasn't overridden
// a field. Every one of these is editable from Admin → Trip Planner Page,
// same pattern as Home/About/Contact.
const DEFAULTS = {
  heroKicker: "KASHMIR TOUR PACKAGES",
  heroTitle: "Kashmir Tour Packages — Plan Your Trip Your Way",
  heroSubtitle:
    "Compare real Kashmir tour packages, or let our local Kashmir team build a custom itinerary — hotels, sightseeing and flight, train or bus, arranged for you. Get a free quote in minutes.",
  tourKicker: "RECOMMENDED",
  tourTitle: "Kashmir Tour Packages",
  tourSubtitle:
    "Handpicked Kashmir itineraries with transparent pricing — every package can be customized with your own hotels, activities or transport.",
  pricingTitle: "How Kashmir Tour Package Pricing Works",
  pricingBody:
    "Kashmir tour package prices depend on your travel dates, trip duration, hotel category and group size — a honeymoon package in peak season prices differently from a budget family trip in the off-season. The packages below show real, current pricing per person; request a quote and our team will confirm the exact price for your dates, with hotels, sightseeing and transport (flight, train or bus) included or arranged as you prefer.",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getTripPlannerContent();
  return buildMetadata({
    title: content?.metaTitle ?? "Kashmir Tour Packages — Plan Your Trip | Vertex Kashmir Holidays",
    description:
      content?.metaDescription ??
      "Browse Kashmir tour packages with transparent pricing, or get a custom Kashmir trip quote — hotels, itineraries and flight/train/bus arranged by our local Kashmir team.",
    canonical: `${SITE_URL}/plan-your-kashmir-trip`,
  });
}

export default async function PlanYourKashmirTripPage() {
  const [
    content,
    heroStats,
    promoBeforeTours,
    promoAfterPricing,
    promoAfterWhy,
    tours,
    whyItems,
    reviews,
    faqs,
    hotels,
  ] = await Promise.all([
    getTripPlannerContent(),
    // Same shared, genuinely live-computed stats as /tours (Rating + Curated
    // Trips are real; Travellers + Years stay admin-set — see
    // src/lib/publicHeroStats.ts's doc comment) — one source, both pages,
    // never two different numbers for the same claim.
    getPublicHeroStats(),
    // Three promo slots, admin-managed exactly like every other PROMO
    // banner on the site (Admin → Banners) — reuses the existing
    // PromoBanner/PromoBannerCard component as-is, just three more page
    // keys. Renders nothing until an admin creates a banner for that
    // specific slot; never placeholder/mock content.
    getBannersForPage("trip-planner-before-tours"),
    getBannersForPage("trip-planner-after-pricing"),
    getBannersForPage("trip-planner-after-why"),
    // Same selection/query shape as the homepage's own tour cross-sell — no
    // separate "recommended tours" config for this page; the existing
    // bestseller/rating-driven query (already admin-configurable via each
    // Tour's own edit form) is the single source of truth for both.
    prisma.tour.findMany({
      where: { published: true, region: "KASHMIR" },
      orderBy: [{ bestseller: "desc" }, { rating: "desc" }],
      take: 4,
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
        destinations: { select: { destination: { select: { name: true } } } },
      },
    }),
    // Sitewide "Why Choose Us" content — same query/content the homepage
    // already uses, real and admin-managed, not invented for this page.
    prisma.whyChooseItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    getDisplayReviews(4),
    // Reuses the homepage's FAQ placement — no new FaqPlacement enum value
    // added for this page (that would need its own schema migration).
    getFaqsForPlacement("HOME"),
    getPublicHotels(),
  ]);

  // Real, live starting price for the "kashmir tour package price" pricing
  // block below — never a hardcoded/invented figure. Null when no published
  // Kashmir tour has a price yet, in which case the block omits the figure
  // rather than showing a fabricated one.
  const startingPrice = tours.length > 0 ? Math.min(...tours.map((t) => t.priceFrom)) : null;

  return (
    <>
      <SecondaryHero
        image="/hero/gulmarg-lg.webp"
        imageMobile="/hero/gulmarg.webp"
        alt="Kashmir valley"
        // Desktop-only: the form is the page's actual job, so it gets more
        // room than the default hero split every other page uses — narrower
        // content column, wider form column. Mobile/tablet unaffected.
        contentWidth="0.85fr"
        asideWidth="minmax(0,560px)"
        asideMaxWidthClass="max-w-xl"
        // Low-friction Trip Planner form — unchanged, per spec.
        aside={<TripPlannerForm className="max-w-xl" />}
      >
        <nav className="flex items-center gap-2 text-[14px] text-white/80" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span>›</span>
          <span className="font-semibold text-white">Kashmir Tour Packages</span>
        </nav>

        <div className="mt-6">
          <p className="hero-reveal text-[12px] font-bold tracking-[0.22em] text-primary">
            {content?.heroKicker ?? DEFAULTS.heroKicker}
          </p>
          <h1
            className="hero-reveal h-display mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-[44px]"
            style={{ "--hr-y": "20px", "--hr-delay": "0.1s" } as React.CSSProperties}
          >
            {content?.heroTitle ?? DEFAULTS.heroTitle}
          </h1>
          <p
            className="hero-reveal mt-3 max-w-lg text-[16px] text-white/85"
            style={{ "--hr-delay": "0.2s" } as React.CSSProperties}
          >
            {content?.heroSubtitle ?? DEFAULTS.heroSubtitle}
          </p>
          <HeroStats stats={heroStats} />
          <HeroWhatsAppCta
            message="Hi! I'd like help planning my Kashmir trip."
            source="trip_planner_hero"
            sourcePage="trip-planner"
          />
        </div>
      </SecondaryHero>

      <PromoBanner banners={toPromoBannerData(promoBeforeTours)} />

      {/* Kashmir Tour Packages — immediately after the hero, per the Google
        Ads search-intent-continuity principle: "kashmir tour packages" ad
        traffic should see real packages before any generic brand content. */}
      <PackagesSection
        heading={{
          kicker: content?.tourKicker ?? DEFAULTS.tourKicker,
          title: content?.tourTitle ?? DEFAULTS.tourTitle,
          subtitle: content?.tourSubtitle ?? DEFAULTS.tourSubtitle,
          ctaLabel: "View all tours",
          ctaHref: "/tours",
        }}
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
        }))}
      />

      {/* Pricing-intent block ("kashmir tour package price") — explains how
        pricing works; the only figure shown is the real, live minimum
        priceFrom across the packages just rendered above, never invented. */}
      <section className="mx-auto max-w-[1300px] px-4 pb-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="text-[18px] font-bold text-foreground">
            {content?.pricingTitle ?? DEFAULTS.pricingTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-foreground/80">
            {content?.pricingBody ?? DEFAULTS.pricingBody}
          </p>
          {startingPrice !== null && (
            <p className="mt-4 text-[14px] font-bold text-primary">
              Kashmir tour packages on this page start from {formatINR(startingPrice)} per person.
            </p>
          )}
        </div>
      </section>

      <PromoBanner banners={toPromoBannerData(promoAfterPricing)} />

      <WhyChooseSection
        heading={{
          kicker: "WHY PLAN WITH VERTEX",
          title: "A local Kashmir team, not a booking engine",
          subtitle: null,
          ctaLabel: null,
          ctaHref: null,
        }}
        items={whyItems.map((w) => ({
          id: w.id,
          emoji: w.emoji,
          title: w.title,
          description: w.description,
        }))}
      />

      <PromoBanner banners={toPromoBannerData(promoAfterWhy)} />

      <TripPlannerHowItWorks />

      <TripPlannerHotelCarousel hotels={hotels} />

      <TestimonialsSection
        heading={{
          kicker: "TRAVELLERS SAY",
          title: "What it's like to plan with us",
          subtitle: null,
          ctaLabel: null,
          ctaHref: null,
        }}
        testimonials={reviews}
      />

      {faqs.length > 0 && (
        <section className="mx-auto max-w-[1300px] px-4 py-14 sm:px-6">
          <div className="text-center">
            <p className="text-[12px] font-bold tracking-[0.22em] text-primary">FAQ</p>
            <h2 className="h-display mt-3 text-[18px] font-bold text-foreground">
              Common questions
            </h2>
          </div>
          <div className="mx-auto mt-8 max-w-3xl">
            <FaqPreviewList faqs={faqs} columns={2} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1300px] px-4 pb-16 sm:px-6">
        <div className="glass rounded-3xl p-8 text-center shadow-card sm:p-12">
          <h2 className="h-display text-[20px] font-bold text-foreground">
            Still deciding? Chat with us on WhatsApp
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-muted-foreground">
            No form needed — tell us what you&apos;re thinking and we&apos;ll take it from there.
          </p>
          <div className="mt-6">
            <a
              href="#trip-planner-form"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110"
            >
              Get My Trip Quote
            </a>
          </div>
        </div>
      </section>

      <TrustSection type="trip-planner" />

      <TripPlannerMobileBar />
    </>
  );
}
