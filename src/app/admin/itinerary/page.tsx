import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { listItinerarySummaries } from "@/lib/itinerary/list";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { ItineraryListClient } from "@/components/admin/itinerary/ItineraryListClient";

export const metadata: Metadata = { title: "Itineraries — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminItineraryPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!role || !(await can(role, "itinerary", "view"))) {
    redirect("/admin/dashboard");
  }

  const isAdmin = role === "SUPERADMIN" || role === "ADMIN";

  const { items, total } = await listItinerarySummaries({
    ownerId: isAdmin ? undefined : session!.user.id,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const [canCreate, canDelete] = await Promise.all([
    can(role, "itinerary", "create"),
    can(role, "itinerary", "delete"),
  ]);

  return (
    <ItineraryListClient
      initialItems={items}
      initialTotal={total}
      showOwner={isAdmin}
      canCreate={canCreate}
      canDelete={canDelete}
    />
  );
}
