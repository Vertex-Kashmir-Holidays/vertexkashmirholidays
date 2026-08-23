import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Overrides the lead detail `loading.tsx` one segment up, which would otherwise
// show a detail/sidebar skeleton over the edit form.
export default function EditLeadLoading() {
  return <FormSkeleton label="Loading lead form" breadcrumb sections={[6, 3]} />;
}
