import { Skeleton } from "@/components/ui/atoms/skeleton";

// Shown while the checkout page's RSC streams (it is force-dynamic — tour,
// site settings and the signed-in customer's prefill are all read per request).
// Mirrors the page's header strip plus BookingForm's 2/3 summary-and-form split
// so the real form drops in without shifting the page.
//
// This lives inside the URL-transparent `(checkout)` group rather than directly
// under `booking/` on purpose. A segment's loading.tsx also wraps that segment's
// children, and on a hard load the OUTER fallback is what renders — so at
// `booking/loading.tsx` this checkout-form skeleton would cover /booking/success
// and /booking/failed, which are only ever reached by a hard Razorpay redirect.
// A customer landing on the confirmation page would watch a payment form
// re-appear. The group scopes this boundary to /booking alone.
export default function BookingLoading() {
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <div className="border-b border-border bg-muted pt-20 pb-10">
        <div className="mx-auto max-w-5xl space-y-4 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-3 w-56 max-w-full" />
          <Skeleton className="h-9 w-72 max-w-full sm:h-10" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Trip summary */}
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <Skeleton className="aspect-[16/9] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="space-y-2 border-t border-border pt-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>

          {/* Guest details + payment */}
          <div className="lg:col-span-3">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 3 }).map((_, row) => (
                <div key={row} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, col) => (
                    <div key={col} className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ))}
              <div className="space-y-4 border-t border-border pt-5">
                <Skeleton className="h-3 w-32" />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
