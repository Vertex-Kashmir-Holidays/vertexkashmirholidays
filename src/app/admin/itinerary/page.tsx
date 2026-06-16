import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ItineraryListClient } from "@/components/admin/itinerary/ItineraryListClient";
import type { ItinerarySummary } from "@/types/itinerary";

export const metadata: Metadata = { title: "Itineraries — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminItineraryPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "itinerary", "view"))) {
    redirect("/admin/dashboard");
  }

  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";

  const items = await prisma.itinerary.findMany({
    where: isAdmin ? {} : { ownerId: session!.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { name: true } },
    },
  });

  const summaries: ItinerarySummary[] = items.map((i) => ({
    id: i.id,
    title: i.title,
    status: i.status,
    ownerId: i.ownerId,
    ownerName: i.owner?.name ?? null,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }));

  const [canCreate, canDelete] = await Promise.all([
    can(role, "itinerary", "create"),
    can(role, "itinerary", "delete"),
  ]);

  return (
    <ItineraryListClient
      initialItems={summaries}
      showOwner={isAdmin}
      canCreate={canCreate}
      canDelete={canDelete}
    />
  );
}
