import { Skeleton } from "@/components/ui/atoms/skeleton";
import { HeroSkeleton } from "@/components/ui/molecules/hero-skeleton";

// Mirrors ContactHero and the 1.05fr/300px split — reach cards and the promise
// list on the left, the enquiry form on the right.
export default function ContactLoading() {
  return (
    <div className="bg-background text-foreground" aria-busy="true" aria-label="Loading contact">
      <HeroSkeleton />

      <main className="mx-auto max-w-[1300px] px-6 py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[1.05fr_300px]">
          <div className="min-w-0 space-y-8">
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-full max-w-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enquiry form */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
