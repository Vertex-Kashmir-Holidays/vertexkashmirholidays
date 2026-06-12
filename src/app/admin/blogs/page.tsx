import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BlogsClient } from "@/components/admin/blogs/BlogsClient";

export const metadata: Metadata = { title: "Blog Posts — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      author: true,
      published: true,
      publishedAt: true,
      createdAt: true,
      coverImage: true,
    },
  });

  return <BlogsClient initialBlogs={blogs} />;
}
