import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the customer's payment ledger RSC streams. Mirrors the page's
// heading + "Total paid" line and the Booking/Type/Method/Date/Amount table,
// which swaps to stacked cards below `md` exactly as the real page does.
export default function AccountPaymentsLoading() {
  return (
    <ListSkeleton
      label="Loading payments"
      rows={5}
      mobileCards={3}
      columns={["flex-1", "w-24", "w-20", "w-24", "w-20"]}
    />
  );
}
