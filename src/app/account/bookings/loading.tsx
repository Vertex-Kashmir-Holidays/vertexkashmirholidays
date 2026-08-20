import { Skeleton } from "@/components/ui/atoms/skeleton";

// Shown while the customer's booking list RSC streams (force-dynamic — it reads
// the session and scopes every row to it). Mirrors the page's heading and the
// stacked link cards: tour title + status pills and trip meta on the left,
// amount on the right.
export default function AccountBookingsLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading bookings">
      <Skeleton className="h-7 w-40" />

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-48 max-w-full" />
                <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
                <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
              </div>
              <Skeleton className="h-3 w-72 max-w-full" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-2 sm:text-right">
              <Skeleton className="h-5 w-24 sm:ml-auto" />
              <Skeleton className="h-3 w-20 sm:ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
