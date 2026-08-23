import { FormSkeleton } from "@/components/ui/molecules/form-skeleton";

// Keeps the blog list `loading.tsx` one segment up from cascading a table
// skeleton onto the editor. Mirrors BlogForm's stacked cards.
export default function NewBlogLoading() {
  return <FormSkeleton label="Loading blog editor" sections={[5, 4]} />;
}
