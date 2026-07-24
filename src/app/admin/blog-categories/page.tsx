import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FIELD_DEFS } from "@/lib/admin/pageFields";
import { ListEditor } from "@/components/admin/pages/ListEditor";
import { PageEditorHeader } from "@/components/admin/pages/PageEditorHeader";

export const metadata: Metadata = { title: "Blog Categories — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminBlogCategoriesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "blogs", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "blogs", "create"),
    can(role, "blogs", "edit"),
    can(role, "blogs", "delete"),
  ]);

  const categories = await prisma.blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/blogs" className="hover:text-primary transition-colors">
              Blogs
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">Categories</li>
        </ol>
      </nav>

      <PageEditorHeader title="Blog Categories" publicHref="/blog" readOnly={!canEdit} />

      <ListEditor
        title="Categories"
        description="Used for filter chips and category badges on the public blog. Sort order controls display order."
        resource="blogCategories"
        fields={FIELD_DEFS.blogCategories}
        items={categories}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        viewHrefTemplate="/blog?category={slug}"
      />
    </div>
  );
}
