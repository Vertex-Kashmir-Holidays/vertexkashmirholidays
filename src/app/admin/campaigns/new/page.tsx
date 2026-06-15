import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { CampaignForm } from "@/components/admin/pages/CampaignForm";

export const metadata: Metadata = { title: "New Campaign — Admin" };
export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "campaigns", "create"))) redirect("/admin/campaigns");

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/campaigns" className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-brand-green">
          <ArrowLeft className="h-3 w-3" /> All Campaigns
        </Link>
        <h2 className="font-display text-xl font-extrabold text-brand-navy">New Campaign</h2>
      </div>
      <CampaignForm initial={null} canEdit />
    </div>
  );
}
