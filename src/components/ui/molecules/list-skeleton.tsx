import { Skeleton } from "@/components/ui/atoms/skeleton";
import { cn } from "@/lib/utils";

export interface ListSkeletonProps {
  /** Announced while the route streams, e.g. "Loading bookings". */
  label: string;
  /** One Tailwind width class per table column, left to right. */
  columns: string[];
  /** One Tailwind width class per filter/search control above the table. */
  filters?: string[];
  rows?: number;
  /** Render the table's column-header strip. Off for card/row lists that have none. */
  header?: boolean;
  /** Stat cards above the list (0 = none). */
  stats?: number;
  /** Reserve the header's primary action ("New …") button. */
  action?: boolean;
  /** Stacked card placeholders shown instead of the table below `md`. */
  mobileCards?: number;
  className?: string;
}

/**
 * Route-level placeholder for the admin list layout every module shares:
 * heading + optional action, an optional filter bar, and a bordered card
 * holding the table. Mirrors the real page's structure so the skeleton is
 * replaced without layout shift.
 */
function ListSkeleton({
  label,
  columns,
  filters = [],
  rows = 6,
  header = true,
  stats = 0,
  action = true,
  mobileCards = 0,
  className,
}: ListSkeletonProps) {
  return (
    <div className={cn("space-y-5", className)} aria-busy="true" aria-label={label}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        {action && <Skeleton className="h-11 w-full rounded-xl sm:h-9 sm:w-32" />}
      </div>

      {stats > 0 && (
        // Matches the StatCard row admin list pages render above the table.
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        {filters.length > 0 && (
          <div className="flex flex-col gap-3 p-4 sm:flex-row">
            {filters.map((w, i) => (
              <Skeleton key={i} className={cn("h-9 rounded-xl", w)} />
            ))}
          </div>
        )}

        {/* Table — desktop and tablet. */}
        <div className={cn("overflow-hidden", mobileCards > 0 && "hidden md:block")}>
          {header ? (
            <div className="border-t border-b border-border bg-muted px-4 py-3">
              <Skeleton className="h-3 w-48" />
            </div>
          ) : (
            <div className="border-t border-border" />
          )}
          <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} className="flex items-center gap-4 px-4 py-3.5">
                {columns.map((w, c) => (
                  <Skeleton key={c} className={cn("h-4", w)} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stacked cards — mobile, for lists that swap the table out entirely. */}
        {mobileCards > 0 && (
          <div className="divide-y divide-border border-t border-border md:hidden">
            {Array.from({ length: mobileCards }).map((_, i) => (
              <div key={i} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
                </div>
                <div className="flex items-end justify-between gap-3">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { ListSkeleton };
