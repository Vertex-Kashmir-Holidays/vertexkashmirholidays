import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// The leads list already has a `loading.tsx`; without this one it would cascade
// its table skeleton onto the create form.
export default function NewLeadLoading() {
  return <FormSkeleton label="Loading lead form" sections={[6, 3]} />;
}
