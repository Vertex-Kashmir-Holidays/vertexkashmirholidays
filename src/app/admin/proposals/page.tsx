import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listProposalSummaries } from "@/lib/proposal/list";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { ProposalsClient } from "@/components/admin/proposal/ProposalsClient";

export const metadata: Metadata = { title: "Proposals — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminProposalsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "proposals", "view"))) {
    redirect("/admin/dashboard");
  }

  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";

  const { items, total } = await listProposalSummaries({
    ownerId: isAdmin ? undefined : session!.user.id,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [canCreate, canDelete] = await Promise.all([
    can(role, "proposals", "create"),
    can(role, "proposals", "delete"),
  ]);

  return (
    <ProposalsClient
      initialItems={items}
      initialTotal={total}
      showOwner={isAdmin}
      canCreate={canCreate}
      canDelete={canDelete}
    />
  );
}
