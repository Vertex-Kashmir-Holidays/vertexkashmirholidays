import { Skeleton } from "@/components/ui/atoms/skeleton";
import { HeroSkeleton } from "@/components/ui/molecules/hero-skeleton";

// Mirrors BlogPostHero and the 1fr/280px article-and-sidebar split. Blog posts
// arrive mostly from search, so the first paint is frequently an uncached
// on-demand render rather than a client-side navigation.
export default function BlogPostLoading() {
  return (
    <div className="bg-background text-foreground" aria-busy="true" aria-label="Loading article">
      <HeroSkeleton />

      <main className="mx-auto max-w-[1300px] px-3 py-10 sm:px-6">
        <div className="grid items-start gap-9 lg:grid-cols-[1fr_280px]">
          {/* Article body */}
          <div className="min-w-0 space-y-4">
            <Skeleton className="h-6 w-2/3" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className={i % 4 === 3 ? "h-3 w-2/3" : "h-3 w-full"} />
            ))}
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={i % 3 === 2 ? "h-3 w-3/4" : "h-3 w-full"} />
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
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
}
