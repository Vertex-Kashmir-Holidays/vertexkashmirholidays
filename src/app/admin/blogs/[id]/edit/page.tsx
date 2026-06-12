import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blogs/BlogForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id }, select: { title: true } });
  return { title: blog ? `Edit: ${blog.title} — Admin` : "Edit Blog Post — Admin" };
}

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params;
  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) notFound();

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-gray-400">
          <li><Link href="/admin/blogs" className="hover:text-brand-green transition-colors">Blogs</Link></li>
          <li aria-hidden><ChevronRight className="w-3 h-3" /></li>
          <li className="text-brand-navy font-medium truncate max-w-[200px]">{blog.title}</li>
        </ol>
      </nav>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-brand-navy text-xl">Edit Blog Post</h2>
          <p className="text-gray-400 text-xs mt-0.5">{blog.title}</p>
        </div>
        {blog.published && (
          <a href={`/blog/${blog.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-green font-semibold hover:underline shrink-0">
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
          excerpt: blog.excerpt ?? "",
          body: blog.body ?? "",
          coverImage: blog.coverImage ?? "",
          published: blog.published,
          metaTitle: blog.metaTitle ?? "",
          metaDesc: blog.metaDesc ?? "",
          ogImage: blog.ogImage ?? "",
        }}
      />
    </div>
  );
}
