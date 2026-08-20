import { Skeleton } from "@/components/ui/atoms/skeleton";
import { CardGridSkeleton } from "@/components/ui/molecules/card-grid-skeleton";
import { HeroSkeleton } from "@/components/ui/molecules/hero-skeleton";

// Mirrors DestinationsHero (SecondaryHero, no aside) followed by
// DestinationsBrowser's region filters and destination card grid.
export default function DestinationsLoading() {
  return (
    <div
      className="bg-background text-foreground"
      aria-busy="true"
      aria-label="Loading destinations"
    >
      <HeroSkeleton />

      <div className="mx-auto max-w-[1300px] space-y-8 px-3 py-12 sm:px-6">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>

        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}
