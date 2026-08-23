import { Skeleton } from "@/components/ui/atoms/skeleton";

// Same reasoning as booking/success/loading.tsx — this is the first paint after
// a failed Razorpay redirect. Mirrors the failure banner, booking details,
// retry options and FAQ block.
export default function BookingFailedLoading() {
  return (
    <div
      className="min-h-screen bg-background pt-20 text-foreground"
      aria-busy="true"
      aria-label="Loading payment result"
    >
      <div className="border-b border-rose-500/20 bg-rose-500/10 py-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4">
          <Skeleton className="h-16 w-16 rounded-full bg-rose-500/20" />
          <Skeleton className="h-10 w-80 max-w-full bg-rose-500/20 sm:h-12" />
          <Skeleton className="h-5 w-full max-w-md bg-rose-500/15" />
          <Skeleton className="h-4 w-full max-w-lg bg-rose-500/10" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Booking details */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Retry options */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Skeleton className="h-5 w-64 max-w-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
