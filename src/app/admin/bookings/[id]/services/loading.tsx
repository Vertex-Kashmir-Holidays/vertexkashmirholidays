import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// The services/payments screen is the heaviest read in the booking flow
// (booking + tour + services + payments + lead + itinerary). Mirrors its
// breadcrumb, heading and 3/1 split: the service editor on the left, the
// itinerary card and payment panel on the right.
export default function BookingServicesLoading() {
  return <FormSkeleton label="Loading booking services" breadcrumb sections={[4, 6]} sidebar={2} />;
}
