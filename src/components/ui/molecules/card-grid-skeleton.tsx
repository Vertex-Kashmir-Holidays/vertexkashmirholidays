import { Skeleton } from "@/components/ui/atoms/skeleton";
import { cn } from "@/lib/utils";

export interface CardGridSkeletonProps {
  /**
   * Announced while the route streams, e.g. "Loading tours". Omit when the grid
   * is nested inside a container that already carries the route's busy label.
   */
  label?: string;
  count?: number;
  /** Largest-breakpoint column count. Below that the grid steps down to 1–2. */
  columns?: 1 | 2 | 3 | 4;
  /** Reserve a cover image above each card's text. */
  media?: boolean;
  className?: string;
}

// Static class strings — Tailwind cannot see interpolated ones.
const GRID_COLUMNS: Record<NonNullable<CardGridSkeletonProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

/**
 * Route-level placeholder for a card grid — the public tour/destination/blog
 * listings, and the single-column card lists in the customer account area.
 */
function CardGridSkeleton({
  label,
  count = 6,
  columns = 3,
  media = true,
  className,
}: CardGridSkeletonProps) {
  return (
    <div
      className={cn("grid gap-5", GRID_COLUMNS[columns], className)}
      aria-busy={label ? "true" : undefined}
      aria-label={label}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {media && <Skeleton className="aspect-[4/3] w-full rounded-none" />}
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { CardGridSkeleton };
