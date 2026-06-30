import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ActivitiesClient } from "@/components/admin/activities/ActivitiesClient";

export const metadata: Metadata = { title: "Activities — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  const session = await auth();
  const role = session!.user.role;

  const [activities, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.activity.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        coverImage: true,
        location: true,
        duration: true,
        price: true,
        published: true,
        _count: { select: { destinations: true, tours: true } },
      },
    }),
    can(role, "activities", "create"),
    can(role, "activities", "edit"),
    can(role, "activities", "delete"),
  ]);

  return <ActivitiesClient initialActivities={activities} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />;
}
