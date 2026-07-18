// src/components/destinations/DestinationRelatedBlogs.tsx
import { BlogPostRelated } from "@/components/blog/BlogPostRelated";
import type { BlogArticleData } from "@/types/blog";

interface DestinationRelatedBlogsProps {
  posts: BlogArticleData[];
}

// Thin wrapper — reuses BlogPostRelated's carousel/card rendering as-is,
// just with a destination-appropriate heading. Curated via
// Destination.relatedBlogIds (editorial, not automatic matching).
export function DestinationRelatedBlogs({ posts }: DestinationRelatedBlogsProps) {
  return <BlogPostRelated posts={posts} title="Related Blogs" />;
}
