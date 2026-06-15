import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { InquiriesClient } from "@/components/admin/inquiries/InquiriesClient";

export const metadata: Metadata = { title: "Inquiries — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "inquiries", "view"))) {
    redirect("/admin/dashboard");
  }

  const [inquiries, total, sources] = await Promise.all([
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.inquiry.count(),
    prisma.inquiry.findMany({ distinct: ["source"], select: { source: true } }),
  ]);

  const canEdit = await can(role, "inquiries", "edit");
  const canDelete = await can(role, "inquiries", "delete");

  return (
    <InquiriesClient
      initialItems={inquiries}
      totalCount={total}
      sources={sources.map((s) => s.source ?? "website").filter((v, i, a) => a.indexOf(v) === i)}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
