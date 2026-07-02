import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { BlogsClient } from "@/components/admin/blogs/BlogsClient";
import { ContentForm, type ContentGroup } from "@/components/admin/pages/ContentForm";

export const metadata: Metadata = { title: "Blog Posts — Admin" };
export const dynamic = "force-dynamic";

const BLOG_HERO_GROUPS: ContentGroup[] = [
  {
    title: "Blog Listing Page",
    fields: [
      { key: "heroImage", label: "Hero image (desktop)", type: "image" },
      { key: "heroImageMobile", label: "Hero image (mobile)", type: "image" },
      { key: "ogImage", label: "OG / social image", type: "image" },
    ],
  },
];

export default async function AdminBlogsPage() {
  const session = await auth();
  const role = session!.user.role;

  const [blogs, blogContent, canCreate, canEdit, canDelete] = await Promise.all([
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
    prisma.blogContent.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    }),
    can(role, "blogs", "create"),
    can(role, "blogs", "edit"),
    can(role, "blogs", "delete"),
  ]);

  return (
    <div className="space-y-8">
      <ContentForm
        contentKey="blogs"
        groups={BLOG_HERO_GROUPS}
        initial={blogContent as Record<string, unknown>}
        canEdit={canEdit}
      />
      <BlogsClient initialBlogs={blogs} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </div>
  );
}
