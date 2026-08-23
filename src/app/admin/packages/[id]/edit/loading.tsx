import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Same PackageForm as the create route, but this one actually waits on a query
// (the tour being edited), so the placeholder is the one visitors see.
export default function EditPackageLoading() {
  return <FormSkeleton label="Loading package form" breadcrumb sections={[6, 4, 4]} />;
}
