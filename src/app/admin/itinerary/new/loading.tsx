import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Keeps the itinerary list `loading.tsx` one segment up from cascading a row
// skeleton onto the builder. Mirrors ItineraryEditor's canvas + toolbar split.
export default function NewItineraryLoading() {
  return <FormSkeleton label="Loading itinerary builder" sections={[4, 6]} sidebar={2} />;
}
