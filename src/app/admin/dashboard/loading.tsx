import { Skeleton } from "@/components/ui/atoms/skeleton";

// Mirrors the dashboard layout: welcome line, three KPI cards, the pipeline /
// alerts / quick-actions row, upcoming trips, then recent leads + bookings.
function PanelSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card shadow-sm ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-[1.35fr_1fr_240px]">
        <PanelSkeleton rows={3} />
        <PanelSkeleton rows={4} />
        <PanelSkeleton rows={4} className="lg:col-span-2 2xl:col-span-1" />
      </div>

      <PanelSkeleton rows={4} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={5} />
      </div>
    </div>
  );
}
