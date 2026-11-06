import type { Metadata } from "next";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { getHotelStayGroups } from "@/lib/trips/board";
import { HotelStaysView } from "@/components/admin/trips/HotelStaysView";

export const metadata: Metadata = { title: "Hotel Stays — Admin" };
export const dynamic = "force-dynamic";

// Hotel stays — every hotel guests are booked into, on trips the user can see.
export default async function AdminHotelStaysPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const guard = await requireModuleView("bookings");
  if (!guard.ok) return guard.page;
  const { role, userId } = guard;

  const allTime = (await searchParams).range === "all";
  const groups = await getHotelStayGroups(role, userId, { allTime });
  return <HotelStaysView groups={groups} allTime={allTime} />;
}
