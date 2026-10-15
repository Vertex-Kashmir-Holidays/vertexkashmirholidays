import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the itinerary list RSC streams. Mirrors ItineraryListClient:
// heading + New Itinerary, search + status filter, then the 7-column table.
export default function AdminItineraryLoading() {
  return (
    <ListSkeleton
      label="Loading itineraries"
      filters={["flex-1", "w-40"]}
      columns={["flex-1", "w-28", "w-28", "w-20", "w-24", "w-28", "w-20"]}
    />
  );
}
