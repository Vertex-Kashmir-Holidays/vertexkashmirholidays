import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CampaignsList } from "@/components/admin/pages/CampaignsList";

export const metadata: Metadata = { title: "Campaigns — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCampaignListPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "campaigns", "view"))) redirect("/admin/dashboard");

  const [canCreate, canDelete] = await Promise.all([
    can(role, "campaigns", "create"),
    can(role, "campaigns", "delete"),
  ]);

  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, slug: true, published: true, updatedAt: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-foreground">Campaigns</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Landing-page campaigns shown at /campaign/[slug].
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/campaigns/new"
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Link>
        )}
      </div>
      <CampaignsList items={campaigns} canDelete={canDelete} />
    </div>
  );
}
