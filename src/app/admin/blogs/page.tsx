import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { BlogsClient } from "@/components/admin/blogs/BlogsClient";

export const metadata: Metadata = { title: "Blog Posts — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBlogsPage() {
  const session = await auth();
  const role = session!.user.role;

  const [blogs, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.blog.findMany({
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
    }),
    can(role, "blogs", "create"),
    can(role, "blogs", "edit"),
    can(role, "blogs", "delete"),
  ]);

  return <BlogsClient initialBlogs={blogs} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />;
}
