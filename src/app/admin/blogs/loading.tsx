import { ListSkeleton } from "@/components/ui/molecules/list-skeleton";

// Shown while the blog list RSC streams. Mirrors BlogsClient's layout: heading +
// Manage Categories/New Post, a search box, then the Title/Author/Status/
// Published/Actions table.
export default function AdminBlogsLoading() {
  return (
    <ListSkeleton
      label="Loading blog posts"
      filters={["max-w-sm flex-1", "w-16"]}
      columns={["flex-1", "w-28", "w-16", "w-24", "w-16"]}
    />
  );
}
