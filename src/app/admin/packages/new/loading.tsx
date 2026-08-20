import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Without this, the packages list `loading.tsx` one segment up would cascade a
// table skeleton onto the create form. Mirrors PackageForm's stacked cards.
export default function NewPackageLoading() {
  return <FormSkeleton label="Loading package form" sections={[6, 4, 4]} />;
}
