import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { dayPlanAccess } from "@/lib/dayPlans/access";
import { prisma } from "@/lib/prisma";
import { ProposalEditor } from "@/components/admin/proposal/ProposalEditor";
import { DEFAULT_PROPOSAL_DATA } from "@/components/admin/proposal/default-data";
import { resolvePrimaryOffice } from "@/lib/companyOffice";
import { getPdfTrustContent } from "@/lib/itinerary/pdfTrustContent";
import { proposalDataSchema } from "@/types/proposal";
import { canAccessProposal, listProposalAssignees } from "@/lib/proposal/access";

export const metadata: Metadata = { title: "Edit Proposal — Admin" };
export const dynamic = "force-dynamic";

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "proposals", "view"))) {
    redirect("/admin/proposals");
  }

  const record = await prisma.proposalItinerary.findUnique({
    where: { id },
    include: { owner: { select: { name: true } } },
  });
  if (!record) notFound();

  const canEditModule = await can(role, "proposals", "edit");
  // Owner, assignee or admin may edit — and hand it to someone else.
  const canSave = canEditModule && canAccessProposal(role, session!.user.id, record);
  const assignees = canSave ? await listProposalAssignees() : [];
  // Only the copy's own author (who can edit and delete) is held to "update it
  // or it's deleted" — an admin just viewing someone's fresh copy never deletes it.
  const ownsCopy =
    canSave && record.ownerId === session!.user.id && (await can(role, "proposals", "delete"));

  // Create the itinerary + list linkable leads (/api/itineraries/linkable needs edit).
  const canConvert =
    (await can(role, "itinerary", "create")) && (await can(role, "itinerary", "edit"));

  const parsed = proposalDataSchema.safeParse(record.data);
  const data = parsed.success ? parsed.data : DEFAULT_PROPOSAL_DATA;

  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  const { address: companyAddress } = await resolvePrimaryOffice(settings);
  const trustContent = await getPdfTrustContent();
  // Picking only fills the editor — saving the proposal still needs canSave.
  const dayPlans = await dayPlanAccess(role);

  return (
    <ProposalEditor
      id={record.id}
      initialData={data}
      initialTitle={record.title}
      initialStatus={record.status}
      canSave={canSave}
      ownsCopy={ownsCopy}
      canConvert={canConvert}
      dayPlans={{ canPick: canSave && dayPlans.canPick, canSave: dayPlans.canSave }}
      assignment={
        canSave
          ? {
              ownerName: record.owner?.name ?? null,
              assignedToId: record.assignedToId,
              staff: assignees,
            }
          : undefined
      }
      companyAddress={companyAddress}
      trustContent={trustContent}
      socialLinks={{
        instagram: settings?.instagram,
        facebook: settings?.facebook,
        youtube: settings?.youtube,
      }}
    />
  );
}
