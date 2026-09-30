import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Without this, the offers list `loading.tsx` would cascade a table skeleton
// onto the edit form.
export default function EditOfferLoading() {
  return <FormSkeleton label="Loading offer" sections={[4]} />;
}
