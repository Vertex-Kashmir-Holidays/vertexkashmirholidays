import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { DocsClient } from "@/components/admin/docs/DocsClient";

export const metadata: Metadata = { title: "Docs — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDocsPage() {
  const guard = await requireModuleView("docs");
  if (!guard.ok) return guard.page;
  const { role } = guard;

  const [items, links, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.adminDocument.findMany({ orderBy: [{ category: "asc" }, { createdAt: "desc" }] }),
    prisma.adminDocLink.findMany({ orderBy: { createdAt: "desc" } }),
    can(role, "docs", "create"),
    can(role, "docs", "edit"),
    can(role, "docs", "delete"),
  ]);

  return (
    <DocsClient
      initialItems={items}
      initialLinks={links}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
