import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the bookings list RSC streams. Mirrors BookingsClient's layout:
// heading, StatCard row, search + status filter, then the Ref/Guest/Travel
// Date/Amount/Converted By/Status/Payment/Actions table (10 rows — the page's
// server-side first page size).
export default function AdminBookingsLoading() {
  return (
    <ListSkeleton
      label="Loading bookings"
      action={false}
      stats={4}
      filters={["flex-1", "w-36"]}
      rows={10}
      columns={["w-16", "flex-1", "w-24", "w-20", "w-24", "w-16", "w-16", "w-16"]}
    />
  );
}
