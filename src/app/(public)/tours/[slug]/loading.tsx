import { Skeleton } from "@/components/ui/atoms/skeleton";
import { HeroSkeleton } from "@/components/ui/molecules/hero-skeleton";

// A tour that is not yet in the ISR cache renders on demand, so this is the
// route where a blank screen was most visible. Mirrors TourDetailsHero, the
// sticky tab strip, and the 1fr/320px content-and-booking-card split.
export default function TourDetailLoading() {
  return (
    <div className="bg-background text-foreground" aria-busy="true" aria-label="Loading tour">
      <HeroSkeleton />

      <main className="mx-auto max-w-[1300px] px-3 pt-3 pb-28 sm:px-6 sm:pt-6 lg:pb-6">
        {/* Section tabs */}
        <div className="flex gap-3 overflow-hidden border-b border-border pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-7">
            {Array.from({ length: 3 }).map((_, section) => (
              <div
                key={section}
                className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>

          {/* Booking card */}
          <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-3 w-40" />
          </aside>
        </div>
      </main>
    </div>
  );
}
