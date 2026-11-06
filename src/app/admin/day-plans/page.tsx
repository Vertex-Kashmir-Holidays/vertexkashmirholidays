import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { DayPlansLibrary } from "@/components/admin/day-plans/DayPlansLibrary";
import type { DayPlanRecord } from "@/lib/dayPlans/schema";

export const metadata: Metadata = { title: "Destinations Library — Admin" };
export const dynamic = "force-dynamic";

// Day Plans library — managed under the Itineraries permission.
export default async function AdminDayPlansPage() {
  const guard = await requireModuleView("itinerary");
  if (!guard.ok) return guard.page;
  const { role } = guard;

  const [rows, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.dayPlan.findMany({
      orderBy: [{ fromPlace: "asc" }, { toPlace: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    can(role, "itinerary", "create"),
    can(role, "itinerary", "edit"),
    can(role, "itinerary", "delete"),
  ]);
  const plans: DayPlanRecord[] = rows.map((r) => ({
    id: r.id,
    fromPlace: r.fromPlace,
    toPlace: r.toPlace,
    title: r.title,
    body: r.body,
    season: r.season,
    isActive: r.isActive,
    sortOrder: r.sortOrder,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <DayPlansLibrary plans={plans} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />;
}
