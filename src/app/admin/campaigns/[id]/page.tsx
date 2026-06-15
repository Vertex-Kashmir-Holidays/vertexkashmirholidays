import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CampaignForm } from "@/components/admin/pages/CampaignForm";

export const metadata: Metadata = { title: "Edit Campaign — Admin" };
export const dynamic = "force-dynamic";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "campaigns", "view"))) redirect("/admin/dashboard");

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const canEdit = await can(role, "campaigns", "edit");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/campaigns" className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-brand-green">
            <ArrowLeft className="h-3 w-3" /> All Campaigns
          </Link>
          <h2 className="font-display text-xl font-extrabold text-brand-navy">Edit: {campaign.name}</h2>
          {!canEdit && <p className="text-xs text-amber-600">You have read-only access.</p>}
        </div>
        <Link href={`/campaign/${campaign.slug}`} target="_blank" className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
          View live <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <CampaignForm initial={campaign} canEdit={canEdit} />
    </div>
  );
}
