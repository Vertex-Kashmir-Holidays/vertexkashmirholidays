import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listProposalPeople, listProposalSummaries } from "@/lib/proposal/list";
import { proposalWhereForUser } from "@/lib/proposal/access";
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

  const scope = proposalWhereForUser(role, session!.user.id);
  const [{ items, total }, people] = await Promise.all([
    listProposalSummaries({ scope, page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    listProposalPeople(scope),
  ]);

  const [canCreate, canEdit, canDelete] = await Promise.all([
    can(role, "proposals", "create"),
    can(role, "proposals", "edit"),
    can(role, "proposals", "delete"),
  ]);

  return (
    <ProposalsClient
      initialItems={items}
      initialTotal={total}
      creators={people.creators}
      assignees={people.assignees}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
