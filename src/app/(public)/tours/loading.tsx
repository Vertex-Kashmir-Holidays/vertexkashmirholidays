import { Skeleton } from "@/components/ui/atoms/skeleton";
import { CardGridSkeleton } from "@/components/ui/molecules/card-grid-skeleton";
import { HeroSkeleton } from "@/components/ui/molecules/hero-skeleton";

// Covers /tours and /tours/category/* (both render the same hero + filtered
// card grid). Mirrors ToursHeroSection — SecondaryHero with the lead-capture
// card as its aside — followed by ToursPageClient's category chips and grid.
export default function ToursLoading() {
  return (
    <div className="bg-background text-foreground" aria-busy="true" aria-label="Loading tours">
      <HeroSkeleton aside />

      <div className="mx-auto max-w-[1300px] space-y-8 px-3 py-12 sm:px-6">
        {/* Category chips */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>

        <CardGridSkeleton count={6} />
      </div>
    </div>
  );
}
