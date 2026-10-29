import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { RateCardEditor } from "@/components/admin/rate-cards/RateCardEditor";
import { toDateInput } from "@/lib/rateCards/schema";
import { parseRateCardData } from "@/lib/rateCards/server";

export const metadata: Metadata = { title: "Edit Rate Card — Admin" };
export const dynamic = "force-dynamic";

export default async function EditRateCardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = session!.user.role;
  const [canEdit, canDuplicate] = await Promise.all([can(role, "rateCards", "edit"), can(role, "rateCards", "create")]);
  if (!canEdit) return <AccessDenied moduleLabel="rate card management" />;

  const { id } = await params;
  const card = await prisma.rateCard.findUnique({
    where: { id },
    include: { updatedBy: { select: { name: true, email: true } } },
  });
  if (!card) notFound();

  const data = parseRateCardData(card.data);
  if (!data) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-sm text-red-700 dark:text-red-300">
        This card&apos;s stored data doesn&apos;t match the rate card format, so it can&apos;t be edited here.
      </p>
    );
  }

  return (
    <RateCardEditor
      // A new version remounts the editor with the saved data.
      key={card.version}
      id={card.id}
      status={card.status}
      version={card.version}
      updatedAt={card.updatedAt.toISOString()}
      updatedByName={card.updatedBy?.name ?? card.updatedBy?.email ?? null}
      meta={{
        name: card.name,
        seasonLabel: card.seasonLabel,
        startDate: toDateInput(card.startDate),
        endDate: toDateInput(card.endDate),
        notes: card.notes,
      }}
      data={data}
      canDuplicate={canDuplicate}
    />
  );
}
