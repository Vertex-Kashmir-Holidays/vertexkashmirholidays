// Shown by Next.js while the banners list RSC streams. Mirrors the page layout
// (heading + action, then a table) so there's no layout shift on load.
export default function BannersLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading banners">
      {/* Heading + New Banner (stacks on mobile like the real page) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-3 w-64 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="h-11 w-full animate-pulse rounded-xl bg-muted sm:h-9 sm:w-32" />
      </div>

      {/* Table skeleton — desktop / tablet */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-8 animate-pulse rounded bg-muted" />
              <div className="h-6 w-12 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Card skeletons — mobile */}
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="w-full space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="flex gap-2">
                <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
