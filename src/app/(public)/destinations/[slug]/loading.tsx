import { Skeleton } from "@/components/ui/atoms/skeleton";
import { HeroSkeleton } from "@/components/ui/molecules/hero-skeleton";

// Mirrors DestinationDetailHero, the section tab strip, and the 1fr/300px
// content-and-sidebar split. Like the tour detail route, an uncached
// destination renders on demand, so the placeholder is what the visitor sees.
export default function DestinationDetailLoading() {
  return (
    <div
      className="bg-background text-foreground"
      aria-busy="true"
      aria-label="Loading destination"
    >
      <HeroSkeleton />

      <div className="flex gap-3 overflow-hidden border-b border-border px-3 py-3 sm:px-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="mx-auto max-w-[1300px] px-3 pt-8 sm:px-6">
        <div className="grid items-start gap-7 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-7">
            {Array.from({ length: 3 }).map((_, section) => (
              <div
                key={section}
                className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <Skeleton className="h-5 w-52" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>

          <aside className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
