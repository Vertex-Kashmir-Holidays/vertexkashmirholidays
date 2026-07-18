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

export const metadata: Metadata = { title: "FAQ Categories — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFaqCategoriesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "faqs", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "faqs", "create"),
    can(role, "faqs", "edit"),
    can(role, "faqs", "delete"),
  ]);

  const categories = await prisma.faqCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-5">
      <nav>
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/admin/faqs" className="hover:text-primary transition-colors">
              FAQs
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="w-3 h-3" />
          </li>
          <li className="text-foreground font-medium">Categories</li>
        </ol>
      </nav>

      <PageEditorHeader title="FAQ Categories" publicHref="/faq" readOnly={!canEdit} />

      <ListEditor
        title="Categories"
        description="Groups FAQs on the /faq knowledge base and in the admin FAQ list. Sort order controls display order."
        resource="faqCategories"
        fields={FIELD_DEFS.faqCategories}
        items={categories}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        viewHrefTemplate="/faq?category={slug}"
      />
    </div>
  );
}
