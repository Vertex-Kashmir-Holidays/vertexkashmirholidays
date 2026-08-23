import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the reviews list RSC streams. Mirrors ReviewsClient's layout:
// heading + Add Review, the total/pending/approved stat row, search + status
// filters, then review cards in a divided list (no column-header strip).
export default function AdminReviewsLoading() {
  return (
    <ListSkeleton
      label="Loading reviews"
      stats={3}
      filters={["flex-1", "w-56"]}
      header={false}
      rows={5}
      columns={["flex-1", "w-24", "w-20", "w-16"]}
    />
  );
}
