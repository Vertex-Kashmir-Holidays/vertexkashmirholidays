import { Star } from "lucide-react";
import { GoogleRatingCard } from "@/components/reviews/GoogleRatingCard";
import { TripadvisorRatingCard } from "@/components/reviews/TripadvisorRatingCard";
import type { GooglePlaceRating } from "@/lib/reviews/googlePlaces";
import type { ParsedTripadvisorWidget } from "@/lib/reviews/tripadvisorWidget";
import type { ReviewStats } from "@/lib/reviews";

const RATINGS = [5, 4, 3, 2, 1] as const;

interface RatingSummaryRowProps {
  googleRating: GooglePlaceRating | null;
  googleProfileUrl?: string | null;
  tripadvisorWidget: ParsedTripadvisorWidget | null;
  tripadvisorProfileUrl?: string | null;
  stats: ReviewStats;
}

// Shared by /reviews and the About page's "What Our Travellers Say" section —
// previously two independently-maintained copies that drifted out of sync.
// Google card (30%-ish) / site rating + star-distribution bars (60%-ish) /
// Tripadvisor card (30%-ish), via a 1:2:1 flex ratio.
export function RatingSummaryRow({
  googleRating,
  googleProfileUrl,
  tripadvisorWidget,
  tripadvisorProfileUrl,
  stats,
}: RatingSummaryRowProps) {
  const hasAnyRating = Boolean(googleRating || tripadvisorWidget || stats.total > 0);
  if (!hasAnyRating) return null;

  return (
    <div className="mx-auto mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center">
      {googleRating && <GoogleRatingCard data={googleRating} profileUrl={googleProfileUrl} />}
      {stats.total > 0 && (
        <div className="flex min-w-0 flex-1 flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-soft sm:basis-0 sm:flex-[2] sm:flex-row sm:gap-10">
          <div className="shrink-0 text-center">
            <p className="font-display text-5xl font-bold text-foreground">
              {stats.average.toFixed(1)}
            </p>
            <div className="mt-1.5 flex justify-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4"
                  strokeWidth={0}
                  fill={i < Math.round(stats.average) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[14px] text-muted-foreground">
              {stats.total.toLocaleString("en-IN")} review{stats.total === 1 ? "" : "s"}
            </p>
          </div>
          <div className="w-full min-w-0 flex-1 space-y-1.5">
            {RATINGS.map((star) => {
              const count = stats.distribution[star];
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2.5 text-[14px]">
                  <span className="w-9 shrink-0 font-semibold text-foreground">{star}★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-8 shrink-0 text-right text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tripadvisorWidget && (
        <TripadvisorRatingCard widget={tripadvisorWidget} profileUrl={tripadvisorProfileUrl} />
      )}
    </div>
  );
}
