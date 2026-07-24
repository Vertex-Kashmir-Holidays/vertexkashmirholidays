import { Skeleton } from "@/components/ui/atoms/skeleton";

// Shown by Next.js while the leads list RSC streams. Mirrors LeadsClient's
// layout (heading, filter bar, then the Ref/Lead/Assigned/Status/Source/
// Last Updated/Actions table) so there's no layout shift.
export default function LeadsLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading leads">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl sm:w-32" />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap gap-3 p-4">
          <Skeleton className="h-9 min-w-[180px] flex-1 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>

        <div className="overflow-hidden">
          <div className="border-t border-b border-border bg-muted px-4 py-3">
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-16" />
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
