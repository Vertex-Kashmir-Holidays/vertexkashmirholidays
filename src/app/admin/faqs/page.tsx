import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { FaqsClient } from "@/components/admin/faqs/FaqsClient";

export const metadata: Metadata = { title: "FAQs — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "faqs", "view"))) redirect("/admin/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "faqs", "create"),
    can(role, "faqs", "edit"),
    can(role, "faqs", "delete"),
  ]);

  const [faqs, categories] = await Promise.all([
    prisma.faq.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        question: true,
        slug: true,
        status: true,
        featured: true,
        placements: true,
        sortOrder: true,
        category: { select: { name: true } },
        _count: { select: { tours: true, destinations: true, blogs: true, campaigns: true, activities: true } },
      },
    }),
    prisma.faqCategory.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <FaqsClient
      initialFaqs={faqs}
      categoryOptions={categories}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
