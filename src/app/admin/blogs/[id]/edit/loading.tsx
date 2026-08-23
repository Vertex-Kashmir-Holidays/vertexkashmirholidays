import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Same BlogForm as the create route, waiting on the post being edited.
export default function EditBlogLoading() {
  return <FormSkeleton label="Loading blog editor" breadcrumb sections={[5, 4]} />;
}
