import { Skeleton } from "@/components/ui/atoms/skeleton";

// The customer lands here straight from Razorpay, so this is the first paint
// after payment — it must never be blank. Mirrors the confirmation banner, trip
// summary, action cards and the "What Happens Next?" list.
export default function BookingSuccessLoading() {
  return (
    <div
      className="min-h-screen bg-background pt-20 text-foreground"
      aria-busy="true"
      aria-label="Loading booking confirmation"
    >
      <div className="bg-primary py-14">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4">
          <Skeleton className="h-16 w-16 rounded-full bg-primary-foreground/25" />
          <Skeleton className="h-10 w-72 max-w-full bg-primary-foreground/25 sm:h-12" />
          <Skeleton className="h-5 w-80 max-w-full bg-primary-foreground/20" />
          <Skeleton className="h-10 w-52 rounded-full bg-primary-foreground/20" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        {/* Trip summary */}
        <div className="flex gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:gap-4">
          <Skeleton className="hidden w-48 shrink-0 rounded-none sm:block" />
          <div className="flex-1 space-y-4 p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-2/3" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* What happens next */}
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Skeleton className="h-5 w-52" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
