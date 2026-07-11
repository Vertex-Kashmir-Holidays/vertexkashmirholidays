import { TripadvisorWidget } from "@/components/reviews/TripadvisorWidget";
import type { ParsedTripadvisorWidget } from "@/lib/reviews/tripadvisorWidget";

// Same card chrome/width as GoogleRatingCard, so the two sit as visually
// matching bookends around the "your reviews" stats card. Unlike
// GoogleRatingCard, the rating content itself comes from Tripadvisor's own
// widget script, not server-fetched data — this card only supplies the
// consistent frame (and the "View on Tripadvisor" link) around it.
export function TripadvisorRatingCard({ widget, profileUrl }: { widget: ParsedTripadvisorWidget; profileUrl?: string | null }) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-center shadow-soft sm:w-64 sm:shrink-0">
      {/* Sized to the widget's real measured content (136x108px, confirmed
          by rendering it and reading the actual DOM rect, not guessed) —
          h-16 was too short and clipped it awkwardly since part of its
          content doesn't respect the overflow-hidden boundary. */}
      <div className="flex h-28 w-full items-center justify-center overflow-hidden">
        <TripadvisorWidget widget={widget} />
      </div>
      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-[12px] font-semibold text-primary hover:underline"
        >
          View on Tripadvisor →
        </a>
      )}
    </div>
  );
}
