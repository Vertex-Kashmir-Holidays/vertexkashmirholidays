import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Mirrors OffersClient: heading + New Offer, then the Offer/Occasion/Dates/
// Packages/Leads/Status/Actions table.
export default function AdminOffersLoading() {
  return (
    <ListSkeleton
      label="Loading offers"
      filters={[]}
      columns={["flex-1", "w-20", "w-24", "w-24", "w-12", "w-16", "w-24"]}
    />
  );
}
