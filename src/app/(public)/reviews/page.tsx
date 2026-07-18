// src/app/(public)/reviews/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/siteSettings";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd, buildBreadcrumbList, buildOrganizationReviews } from "@/components/seo/JsonLd";
import { getApprovedReviewsPage, getReviewStats } from "@/lib/reviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewsHero } from "@/components/reviews/ReviewsHero";
import { getGooglePlaceRating } from "@/lib/reviews/googlePlaces";
import { GoogleRatingBadge } from "@/components/reviews/GoogleRatingBadge";
import { SiteRatingBadge } from "@/components/reviews/SiteRatingBadge";
import { parseTripadvisorWidget } from "@/lib/reviews/tripadvisorWidget";
import { TripadvisorWidget } from "@/components/reviews/TripadvisorWidget";
import { RatingSummaryRow } from "@/components/reviews/RatingSummaryRow";
import { VideoReviewsSection } from "@/components/home/VideoReviewsSection";

export const revalidate = 300;

const PER_PAGE = 12;
const RATINGS = [5, 4, 3, 2, 1] as const;

type PageProps = { searchParams: Promise<{ page?: string; rating?: string }> };

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getReviewsContent = cache(async () =>
  prisma.reviewsContent.findUnique({ where: { id: "singleton" } }),
);

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const canonical = page > 1 ? `${SITE_URL}/reviews?page=${page}` : `${SITE_URL}/reviews`;

  const content = await getReviewsContent();

  return buildMetadata({
    title: "Customer Reviews & Ratings — Real Traveller Experiences",
    description:
      "Read verified customer reviews and ratings for Vertex Kashmir Holidays — real feedback from travellers who booked honeymoon, family, adventure and luxury Kashmir tour packages with us.",
    canonical,
    ogImage: content?.ogImage ?? content?.heroImage ?? null,
  });
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const { page: pageParam, rating: ratingParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const rating = ratingParam
    ? Math.min(5, Math.max(1, parseInt(ratingParam, 10) || 0)) || undefined
    : undefined;

  const [{ items, total }, stats, settings, heroContent, videos] = await Promise.all([
    getApprovedReviewsPage({ page, perPage: PER_PAGE, rating }),
    getReviewStats(),
    getSiteSettings(),
    getReviewsContent(),
    prisma.videoReview.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const googleRating = await getGooglePlaceRating(settings?.googlePlaceId);
  const tripadvisorHeroWidget = parseTripadvisorWidget(settings?.tripadvisorHeroWidgetEmbed);
  const tripadvisorRatingWidget = parseTripadvisorWidget(settings?.tripadvisorRatingWidgetEmbed);

  const heroBadges = (googleRating || tripadvisorHeroWidget || stats.total > 0) && (
    <>
      {googleRating && (
        <GoogleRatingBadge data={googleRating} profileUrl={settings?.googleReviews} />
      )}
      {tripadvisorHeroWidget && (
        // Fixed to the widget's real measured size — 64px icon + 20px rating
        // callout below it = 64x84px total (confirmed by rendering it and
        // reading the actual DOM rects, not guessed) — without this the raw
        // widget renders huge before/without a size constraint.
        <div className="glass flex h-[50px] w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl text-white">
          <TripadvisorWidget widget={tripadvisorHeroWidget} />
        </div>
      )}
      <SiteRatingBadge average={stats.average} total={stats.total} />
    </>
  );

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: "Home", url: SITE_URL },
    { name: "Reviews", url: `${SITE_URL}/reviews` },
  ]);

  // Augments the same organization entity the public layout already declares
  // (see buildOrganizationReviews) rather than redeclaring it — avoids two
  // full TravelAgency blocks on one page.
  const organizationReviewsJsonLd = buildOrganizationReviews({
    aggregateRating:
      stats.total > 0 ? { ratingValue: stats.average, reviewCount: stats.total } : null,
    // A representative sample, not every review ever left — the page itself
    // still lists everything via pagination.
    reviews: items.slice(0, 20).map((r) => ({
      author: r.name,
      rating: r.rating,
      body: r.body,
      datePublished: r.createdAt.toISOString(),
    })),
  });

  return (
    <div className="bg-background text-foreground">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={organizationReviewsJsonLd} />

      <ReviewsHero
        data={{
          breadcrumb: heroContent?.heroBreadcrumb ?? "Reviews",
          title: heroContent?.heroTitle ?? "Customer Reviews & Ratings",
          subtitle:
            heroContent?.heroSubtitle ??
            "Every review below is from a customer who actually booked and travelled with Vertex Kashmir Holidays — collected after their trip, published only once approved. Nothing here is written by us.",
          image: heroContent?.heroImage ?? "/hero/lidder-reiver-lg.webp",
          imageMobile: heroContent?.heroImageMobile ?? "/hero/lidder-river.webp",
        }}
        badges={heroBadges}
      />

      <div className="mx-auto max-w-[1300px] px-4 py-12 sm:px-6 sm:py-16">
        {(stats.total > 0 || googleRating || tripadvisorRatingWidget) && (
          <>
            <h2 className="sr-only">
              Review ratings summary — Google, Tripadvisor and Vertex Kashmir Holidays
            </h2>
            <RatingSummaryRow
              googleRating={googleRating}
              googleProfileUrl={settings?.googleReviews}
              tripadvisorWidget={tripadvisorRatingWidget}
              tripadvisorProfileUrl={settings?.tripadvisor}
              stats={stats}
            />
          </>
        )}

        {/* ── External platform link-outs ──────────────────────────────────── */}
        {(settings?.googleReviews || settings?.tripadvisor) && (
          <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
            {settings?.googleReviews && (
              <a
                href={settings.googleReviews}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold transition hover:border-primary hover:bg-muted"
              >
                See our reviews on Google
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              </a>
            )}
            {settings?.tripadvisor && (
              <a
                href={settings.tripadvisor}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-border bg-card px-5 py-3.5 text-sm font-semibold transition hover:border-primary hover:bg-muted"
              >
                See our reviews on Tripadvisor
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              </a>
            )}
          </div>
        )}

        {/* ── Rating filter ────────────────────────────────────────────────── */}
        {stats.total > 0 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/reviews"
              className={`rounded-full border px-4 py-1.5 text-[14px] font-semibold transition ${
                !rating
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              All
            </Link>
            {RATINGS.map((star) => (
              <Link
                key={star}
                href={`/reviews?rating=${star}`}
                className={`rounded-full border px-4 py-1.5 text-[14px] font-semibold transition ${
                  rating === star
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted"
                }`}
              >
                {star}★
              </Link>
            ))}
          </div>
        )}

        {/* ── Review grid ──────────────────────────────────────────────────── */}
        {items.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No reviews {rating ? `with a ${rating}★ rating ` : ""}yet.
          </p>
        )}

        {/* ── Pagination ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={`/reviews?${new URLSearchParams({ ...(rating ? { rating: String(rating) } : {}), page: String(page - 1) }).toString()}`}
                className="rounded-xl border border-border px-4 py-2 text-[14px] font-semibold transition hover:bg-muted"
              >
                ← Previous
              </Link>
            )}
            <span className="text-[14px] text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/reviews?${new URLSearchParams({ ...(rating ? { rating: String(rating) } : {}), page: String(page + 1) }).toString()}`}
                className="rounded-xl border border-border px-4 py-2 text-[14px] font-semibold transition hover:bg-muted"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Same max-width as the review-grid container above, so the video row
          lines up with it exactly rather than using VideoReviewsSection's own
          (wider) home-page max-width. */}
      <div className="mx-auto max-w-[1300px] pb-4">
        <VideoReviewsSection
          heading={{
            kicker: "IN THEIR OWN WORDS",
            title: "Watch Real Traveller Stories",
            subtitle: "Short video reviews straight from guests who travelled with us.",
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
      </div>

      {/* ── Closing CTA ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1300px] px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-primary/10 p-6 text-center">
          <p className="font-display text-lg font-bold text-foreground">
            Ready to plan your own Kashmir trip?
          </p>
          <Link
            href="/tours"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[14px] font-bold text-primary-foreground shadow-glow transition hover:brightness-110"
          >
            Browse Tour Packages
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </div>
  );
}
