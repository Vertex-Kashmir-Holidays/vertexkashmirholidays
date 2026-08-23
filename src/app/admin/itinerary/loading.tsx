import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the itinerary list RSC streams. Mirrors ItineraryListClient:
// heading + New Itinerary, search + status filter, then plain divided rows —
// the list has no column-header strip, hence `header={false}`.
export default function AdminItineraryLoading() {
  return (
    <ListSkeleton
      label="Loading itineraries"
      filters={["flex-1", "w-40"]}
      header={false}
      columns={["flex-1", "w-20", "w-24", "w-16"]}
    />
  );
}
