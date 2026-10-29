import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { RateCardsManageClient } from "@/components/admin/rate-cards/RateCardsManageClient";

export const metadata: Metadata = { title: "Manage Rate Cards — Admin" };
export const dynamic = "force-dynamic";

// The admin layout only checks rateCards "view" (enough for the sales view);
// managing cards — drafts included — needs "edit".
export default async function ManageRateCardsPage() {
  const session = await auth();
  const role = session!.user.role;
  const [canEdit, canDuplicate] = await Promise.all([can(role, "rateCards", "edit"), can(role, "rateCards", "create")]);
  if (!canEdit) return <AccessDenied moduleLabel="rate card management" />;

  const cards = await prisma.rateCard.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      seasonLabel: true,
      startDate: true,
      endDate: true,
      status: true,
      version: true,
      updatedAt: true,
      updatedBy: { select: { name: true, email: true } },
    },
  });

  return (
    <RateCardsManageClient
      canDuplicate={canDuplicate}
      cards={cards.map((c) => ({
        id: c.id,
        name: c.name,
        seasonLabel: c.seasonLabel,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate.toISOString(),
        status: c.status,
        version: c.version,
        updatedAt: c.updatedAt.toISOString(),
        updatedByName: c.updatedBy?.name ?? c.updatedBy?.email ?? null,
      }))}
    />
  );
}
