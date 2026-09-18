import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import {
  getCompletedBookings,
  summarizeCards,
  buildMonthlySeries,
  topToursByRevenue,
} from "@/lib/finance/completedBookings";
import { FinanceDashboardClient } from "@/components/admin/finance/FinanceDashboardClient";

export const metadata: Metadata = { title: "Finance — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const guard = await requireModuleView("finance");
  if (!guard.ok) return guard.page;

  const [rows, salespeople, tours] = await Promise.all([
    getCompletedBookings(),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES", "EDITOR"] }, deletedAt: null },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.tour.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  const initialBookings = rows.slice(0, 20).map((r) => ({
    ...r,
    travelDate: r.travelDate.toISOString(),
    travelEndDate: r.travelEndDate ? r.travelEndDate.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
  const cards = summarizeCards(rows);
  const monthlySeries = buildMonthlySeries(rows, "travelDate");
  const topTours = topToursByRevenue(rows, 5);

  return (
    <FinanceDashboardClient
      initialBookings={initialBookings}
      initialTotal={rows.length}
      initialCards={cards}
      initialMonthlySeries={monthlySeries}
      initialTopTours={topTours}
      salespeople={salespeople}
      tours={tours}
    />
  );
}
