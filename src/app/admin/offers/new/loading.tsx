import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Without this, the offers list `loading.tsx` one segment up would cascade a
// table skeleton onto the create form.
export default function NewOfferLoading() {
  return <FormSkeleton label="Loading offer form" sections={[4]} />;
}
