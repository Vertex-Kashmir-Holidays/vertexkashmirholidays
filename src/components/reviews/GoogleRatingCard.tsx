import { Star } from "lucide-react";
import type { GooglePlaceRating } from "@/lib/reviews/googlePlaces";
import { GoogleMark } from "@/components/reviews/GoogleMark";

// Bigger stat card — sits alongside the "your reviews" stats card below the
// hero, giving Google equal visual weight. Rating + review count only, no
// review text (that's the deliberate scope after simplifying away the full
// Google review-cards section).
export function GoogleRatingCard({ data, profileUrl }: { data: GooglePlaceRating; profileUrl?: string | null }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-soft sm:w-64 sm:shrink-0">
      <GoogleMark className="h-6 w-6 shrink-0" />
      <p className="font-display text-4xl font-bold text-foreground">{data.rating.toFixed(1)}</p>
      <div className="flex gap-0.5 text-amber-400" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4" strokeWidth={0} fill={i < Math.round(data.rating) ? "currentColor" : "none"} />
        ))}
      </div>
      <p className="text-[12px] text-muted-foreground">
        {data.total > 0 ? `${data.total.toLocaleString("en-IN")} Google reviews` : "Google reviews"}
      </p>
      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-[12px] font-semibold text-primary hover:underline"
        >
          View on Google →
        </a>
      )}
    </div>
  );
}
