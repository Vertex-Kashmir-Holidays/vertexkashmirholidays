import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Shown while a customer's booking detail RSC streams (booking + tour +
// services + payments + itinerary in one query). Mirrors the page's back link
// and its stack of bordered cards: summary, services, payments and itinerary.
export default function AccountBookingDetailLoading() {
  return (
    <FormSkeleton label="Loading booking details" breadcrumb action={false} sections={[4, 4, 3]} />
  );
}
