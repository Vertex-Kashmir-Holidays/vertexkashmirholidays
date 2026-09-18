import type { Metadata } from "next";
import { requireModuleView } from "@/lib/admin/moduleGuard";
import { getCompletedBookings, summarizeCards } from "@/lib/finance/completedBookings";
import { getOperatingExpenses } from "@/lib/finance/operatingExpenses";
import { round2 } from "@/lib/bookings/finance";
import { FinanceOverviewClient } from "@/components/admin/finance/FinanceOverviewClient";

export const metadata: Metadata = { title: "Finance Overview — Admin" };
export const dynamic = "force-dynamic";

/**
 * P&L / Business Money overview — a second view over the Finance data the
 * "finance" module already covers (see MODULE_PATH_ALIASES in
 * moduleGuard.tsx), not a separate resource or a new RBAC module.
 */
export default async function AdminFinanceOverviewPage() {
  const guard = await requireModuleView("finance");
  if (!guard.ok) return guard.page;

  const [rows, operatingExpenses] = await Promise.all([
    getCompletedBookings({ dateField: "travelDate" }),
    getOperatingExpenses({}),
  ]);

  const cards = summarizeCards(rows);
  const cost = round2(rows.reduce((s, r) => s + r.serviceCost, 0));
  const grossProfit = cards.totalProfit;
  const netProfit = round2(grossProfit - operatingExpenses.total);
  const moneyIn = round2(cards.totalOnlineAmount + cards.totalCashAmount);
  const moneyOut = operatingExpenses.total;

  const initial = {
    profitAndLoss: {
      revenue: cards.totalBookingAmount,
      cost,
      gst: cards.totalGst,
      grossProfit,
      operatingExpenses: operatingExpenses.total,
      netProfit,
    },
    businessMoney: {
      totalRevenue: cards.totalBookingAmount,
      onlineCollected: cards.totalOnlineAmount,
      cashCollected: cards.totalCashAmount,
      totalBookingCost: cost,
      totalGst: cards.totalGst,
      totalOperatingExpenses: operatingExpenses.total,
      totalProfit: netProfit,
      moneyIn,
      moneyOut,
      netPosition: round2(moneyIn - moneyOut),
    },
  };

  return <FinanceOverviewClient initial={initial} />;
}
