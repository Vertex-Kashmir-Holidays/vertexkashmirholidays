import { Star } from "lucide-react";
import type { GooglePlaceRating } from "@/lib/reviews/googlePlaces";
import { GoogleMark } from "@/components/reviews/GoogleMark";

// Compact trust badge — rating + review count only, no review text. Meant to
// sit next to a TripAdvisor award widget (e.g. in the hero), not as a full
// review-content section.
export function GoogleRatingBadge({ data, profileUrl }: { data: GooglePlaceRating; profileUrl?: string | null }) {
  const Wrapper = profileUrl ? "a" : "div";
  return (
    <Wrapper
      {...(profileUrl ? { href: profileUrl, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="glass flex h-[52px] shrink-0 items-center gap-2.5 rounded-xl px-5 py-3 text-white transition hover:bg-white/10"
    >
      <GoogleMark className="h-7 w-7 shrink-0" />
      <span className="flex items-center gap-1.5 text-base font-bold">
        {data.rating.toFixed(1)}
        <Star className="h-4 w-4 text-amber-400" strokeWidth={0} fill="currentColor" aria-hidden="true" />
      </span>
      {data.total > 0 && (
        <span className="text-[14px] text-white/75">({data.total.toLocaleString("en-IN")})</span>
      )}
    </Wrapper>
  );
}
