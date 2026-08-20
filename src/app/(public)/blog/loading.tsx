import { Skeleton } from "@/components/ui/atoms/skeleton";
import { CardGridSkeleton } from "@/components/ui/molecules/card-grid-skeleton";
import { HeroSkeleton } from "@/components/ui/molecules/hero-skeleton";

// Covers /blog and /blog/author/* (both render the same hero + filtered article
// list). Mirrors BlogHero, the category chips, the featured post, and
// BlogPageClient's article grid with its trending sidebar.
export default function BlogLoading() {
  return (
    <div className="bg-background text-foreground" aria-busy="true" aria-label="Loading blog">
      <HeroSkeleton />

      <div className="mx-auto max-w-[1300px] space-y-8 px-3 py-12 sm:px-6">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>

        {/* Featured post */}
        <div className="grid gap-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-2">
          <Skeleton className="aspect-[16/9] w-full rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px]">
          <CardGridSkeleton count={6} columns={2} />

          <aside className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <Skeleton className="h-4 w-32" />
                {Array.from({ length: 4 }).map((_, r) => (
                  <div key={r} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                    <div className="w-full space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
