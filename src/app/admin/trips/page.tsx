import type { Metadata } from "next";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { getTripCards } from "@/lib/trips/board";
import { TripsBoard } from "@/components/admin/trips/TripsBoard";

export const metadata: Metadata = { title: "Upcoming Trips — Admin" };
export const dynamic = "force-dynamic";

// Trips board — same visibility as Bookings (sales: own trips, admins: all).
export default async function AdminTripsPage() {
  const guard = await requireModuleView("bookings");
  if (!guard.ok) return guard.page;
  const { role, userId } = guard;

  const trips = await getTripCards(role, userId);
  return <TripsBoard trips={trips} showAssignee={role === "ADMIN" || role === "SUPERADMIN"} />;
}
