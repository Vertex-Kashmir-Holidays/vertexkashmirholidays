import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getCompletedBookings, summarizeCards } from "@/lib/finance/completedBookings";
import { getOperatingExpenses } from "@/lib/finance/operatingExpenses";
import { round2 } from "@/lib/bookings/finance";

export const dynamic = "force-dynamic";

/**
 * Finance Overview (P&L) + Business Money. Every figure is derived from the
 * same shared utilities the dashboard and expenses pages use — nothing here
 * recomputes a booking/GST/profit number independently.
 *
 * Waterfall (see .ai plan for why this deliberately reorders the task's
 * suggested structure): Revenue - Cost - GST = Gross Profit (this is exactly
 * computeBookingProfit's own formula, summed) - Operating Expenses = Net
 * Profit. GST is shown as its own line for transparency but is NOT subtracted
 * a second time after Gross Profit — it's already netted into that figure.
 */
export async function GET(req: NextRequest) {
  const guard = await requirePermission("finance", "view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const from = dateFrom ? new Date(dateFrom) : undefined;
  const to = dateTo ? new Date(dateTo) : undefined;

  const [rows, operatingExpenses] = await Promise.all([
    getCompletedBookings({ dateField: "travelDate", dateFrom: from, dateTo: to }),
    getOperatingExpenses({ from, to }),
  ]);

  const cards = summarizeCards(rows);
  const revenue = cards.totalBookingAmount;
  const cost = round2(rows.reduce((s, r) => s + r.serviceCost, 0));
  const gst = cards.totalGst;
  const grossProfit = cards.totalProfit; // computeBookingProfit, already nets GST — see doc comment above
  const netProfit = round2(grossProfit - operatingExpenses.total);

  const moneyIn = round2(cards.totalOnlineAmount + cards.totalCashAmount);
  const moneyOut = operatingExpenses.total;

  return NextResponse.json({
    profitAndLoss: {
      revenue,
      cost,
      gst,
      grossProfit,
      operatingExpenses: operatingExpenses.total,
      netProfit,
    },
    businessMoney: {
      totalRevenue: revenue,
      onlineCollected: cards.totalOnlineAmount,
      cashCollected: cards.totalCashAmount,
      totalBookingCost: cost,
      totalGst: gst,
      totalOperatingExpenses: operatingExpenses.total,
      totalProfit: netProfit,
      moneyIn,
      moneyOut,
      netPosition: round2(moneyIn - moneyOut),
    },
  });
}
