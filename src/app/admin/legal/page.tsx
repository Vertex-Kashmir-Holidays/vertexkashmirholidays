import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PageEditorHeader } from "@/components/admin/pages/PageEditorHeader";
import { LegalPagesClient } from "@/components/admin/legal/LegalPagesClient";
import { LEGAL_PAGES } from "@/lib/legal/content";

export const metadata: Metadata = { title: "Legal Pages — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "legal", "view"))) redirect("/admin/dashboard");

  const canEdit = await can(role, "legal", "edit");
  const records = await prisma.legalPage.findMany();
  const bySlug = new Map(records.map((r) => [r.slug, r]));

  // Always surface all three pages, pre-filled from the DB or shipped defaults.
  const pages = LEGAL_PAGES.map((def) => {
    const row = bySlug.get(def.slug);
    return {
      slug: def.slug,
      navLabel: def.navLabel,
      title: row?.title ?? def.title,
      content: row?.content ?? def.content,
      updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
    };
  });

  return (
    <div className="space-y-6">
      <PageEditorHeader title="Legal Pages" readOnly={!canEdit} />
      <p className="-mt-2 text-sm text-muted-foreground">
        Terms &amp; Conditions, Privacy Policy and Refund &amp; Cancellation. Content supports HTML
        and is published instantly to the public site.
      </p>
      <LegalPagesClient pages={pages} canEdit={canEdit} />
    </div>
  );
}
