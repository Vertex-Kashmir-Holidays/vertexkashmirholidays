import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// The lead detail screen is the CRM's busiest read (lead + itinerary + booking
// + activity). Mirrors its breadcrumb and detail/sidebar split, and keeps the
// leads list `loading.tsx` from cascading a table skeleton here.
export default function LeadDetailLoading() {
  return (
    <FormSkeleton label="Loading lead" breadcrumb action={false} sections={[4, 5]} sidebar={2} />
  );
}
