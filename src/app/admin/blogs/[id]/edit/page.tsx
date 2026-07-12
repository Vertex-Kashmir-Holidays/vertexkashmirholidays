import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blogs/BlogForm";
import { parseRelatedTours } from "@/lib/tours/content";

type Props = { params: Promise<{ id: string }> };

// Wrapped in React's cache() so generateMetadata() and the page component
// share one query per request instead of each fetching this row separately.
const getBlog = cache(async (id: string) => prisma.blog.findUnique({ where: { id } }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const blog = await getBlog(id);
  return { title: blog ? `Edit: ${blog.title} — Admin` : "Edit Blog Post — Admin" };
}

export const dynamic = "force-dynamic";

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params;
  const [blog, categories, tours] = await Promise.all([
    getBlog(id),
    prisma.blogCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    prisma.tour.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  if (!blog) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li><Link href="/admin/blogs" className="hover:text-primary transition-colors">Blogs</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-foreground font-medium truncate max-w-[200px]">{blog.title}</li>
        </ol>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Edit Blog Post</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{blog.title}</p>
        </div>
        {blog.published && (
          <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary font-semibold hover:underline shrink-0">
            View Live ↗
          </a>
        )}
      </div>
      <BlogForm
        defaults={{
          id: blog.id,
          title: blog.title,
          slug: blog.slug,
          author: blog.author ?? "",
          authorRole: blog.authorRole ?? "",
          authorBio: blog.authorBio ?? "",
          authorImage: blog.authorImage ?? "",
          category: blog.category ?? "",
          readTime: blog.readTime != null ? String(blog.readTime) : "",
          featured: blog.featured,
          trending: blog.trending,
          relatedTours: parseRelatedTours(blog.relatedTours),
          excerpt: blog.excerpt ?? "",
          quickAnswer: blog.quickAnswer ?? "",
          body: blog.body ?? "",
          coverImage: blog.coverImage ?? "",
          coverImageMobile: blog.coverImageMobile ?? "",
          published: blog.published,
          metaTitle: blog.metaTitle ?? "",
          metaDesc: blog.metaDesc ?? "",
          ogImage: blog.ogImage ?? "",
          ogTitle: blog.ogTitle ?? "",
          ogDescription: blog.ogDescription ?? "",
        }}
        categoryOptions={categories}
        tourOptions={tours}
      />
    </div>
  );
}
