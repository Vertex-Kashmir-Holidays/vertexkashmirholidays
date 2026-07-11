// src/components/about/AboutReviews.tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { RatingSummaryRow } from '@/components/reviews/RatingSummaryRow';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import type { GooglePlaceRating } from '@/lib/reviews/googlePlaces';
import type { ParsedTripadvisorWidget } from '@/lib/reviews/tripadvisorWidget';
import type { ReviewListItem, ReviewStats } from '@/lib/reviews';

interface AboutReviewsProps {
  googleRating: GooglePlaceRating | null;
  googleProfileUrl: string | null;
  tripadvisorWidget: ParsedTripadvisorWidget | null;
  tripadvisorProfileUrl: string | null;
  siteStats: ReviewStats;
  reviews: ReviewListItem[];
}

// Reuses the exact same rating-summary row as /reviews (RatingSummaryRow) —
// previously a separately-maintained compact copy that drifted out of sync
// with edits made to the /reviews version. Only the review cards below and
// the "read all" link are About-specific.
export function AboutReviews({
  googleRating,
  googleProfileUrl,
  tripadvisorWidget,
  tripadvisorProfileUrl,
  siteStats,
  reviews,
}: AboutReviewsProps) {
  const hasAnyRating = Boolean(googleRating || tripadvisorWidget || siteStats.total > 0);
  if (!hasAnyRating && reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1300px] px-6 py-14">
      <div className="text-center">
        <p className="text-[11.5px] font-bold tracking-[0.22em] text-primary">REAL FEEDBACK</p>
        <h2 className="h-display mt-3 font-display text-[30px] font-bold leading-snug">What Our Travellers Say</h2>
      </div>

      <RatingSummaryRow
        googleRating={googleRating}
        googleProfileUrl={googleProfileUrl}
        tripadvisorWidget={tripadvisorWidget}
        tripadvisorProfileUrl={tripadvisorProfileUrl}
        stats={siteStats}
      />

      {reviews.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Link href="/reviews" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline">
          Read all reviews
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}
