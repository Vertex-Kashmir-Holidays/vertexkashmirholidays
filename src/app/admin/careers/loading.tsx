import { Skeleton } from "@/components/ui/atoms/skeleton";

// Shown by Next.js while the Careers job list RSC streams. Mirrors
// CareersClient's layout (heading + New Job, search bar, then the
// Job/Location/Status/Posted/Actions table) so there's no layout shift.
export default function CareersLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading careers">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl sm:h-9 sm:w-28" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="h-9 max-w-sm flex-1 rounded-xl" />
          <Skeleton className="h-3 w-16 shrink-0" />
        </div>

        <div className="overflow-hidden">
          <div className="border-t border-b border-border bg-muted px-4 py-3">
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
