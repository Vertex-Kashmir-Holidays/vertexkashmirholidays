import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// The saved itinerary is loaded before the builder can render, so this is the
// itinerary route where the wait is actually visible.
export default function ItineraryEditorLoading() {
  return (
    <FormSkeleton label="Loading itinerary builder" breadcrumb sections={[4, 6]} sidebar={2} />
  );
}
