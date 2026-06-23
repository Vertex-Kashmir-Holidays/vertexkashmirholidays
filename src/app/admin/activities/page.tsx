import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ActivitiesClient } from "@/components/admin/activities/ActivitiesClient";

export const metadata: Metadata = { title: "Activities — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminActivitiesPage() {
  const activities = await prisma.activity.findMany({
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
  });

  return <ActivitiesClient initialActivities={activities} />;
}
