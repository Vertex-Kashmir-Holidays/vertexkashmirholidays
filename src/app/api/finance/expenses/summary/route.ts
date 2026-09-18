import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { round2 } from "@/lib/bookings/finance";
import { monthWindow } from "@/lib/finance/completedBookings";

export const dynamic = "force-dynamic";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Cards + charts for the Expenses page. Reads directly off Expense (a flat
 * table — no per-row derivation needed, unlike the completed-bookings side).
 */
export async function GET(req: NextRequest) {
  const guard = await requirePermission("expenses", "view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const rangeWhere =
    dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {};

  const [totalAgg, currentMonthAgg, byCategory, rowsForTrend, salaryCategory] = await Promise.all([
    prisma.expense.aggregate({ where: { deletedAt: null, ...rangeWhere }, _sum: { amount: true } }),
    prisma.expense.aggregate({
      where: { deletedAt: null, date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { deletedAt: null, ...rangeWhere },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, ...rangeWhere },
      select: { date: true, amount: true, categoryId: true },
    }),
    prisma.expenseCategory.findFirst({ where: { name: "Salary" }, select: { id: true } }),
  ]);

  const categories = await prisma.expenseCategory.findMany({ select: { id: true, name: true } });
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const categoryBreakdown = byCategory
    .map((g) => ({
      categoryId: g.categoryId,
      categoryName: categoryName.get(g.categoryId) ?? "Unknown",
      total: round2(g._sum.amount ?? 0),
    }))
    .sort((a, b) => b.total - a.total);

  const salaryCategoryId = salaryCategory?.id ?? null;
  const marketingNames = new Set(["Meta Ads", "Google Ads", "Marketing"]);
  let marketingTotal = 0;
  let salaryTotal = 0;
  let otherTotal = 0;
  for (const c of categoryBreakdown) {
    if (c.categoryId === salaryCategoryId) salaryTotal += c.total;
    else if (marketingNames.has(c.categoryName)) marketingTotal += c.total;
    else otherTotal += c.total;
  }

  const monthlyBuckets = new Map<string, number>();
  for (const r of rowsForTrend) {
    const key = monthKey(r.date);
    monthlyBuckets.set(key, round2((monthlyBuckets.get(key) ?? 0) + r.amount));
  }
  const monthlyTrend = monthWindow([...monthlyBuckets.keys()]).map((month) => ({
    month,
    total: monthlyBuckets.get(month) ?? 0,
  }));

  return NextResponse.json({
    cards: {
      totalExpenses: round2(totalAgg._sum.amount ?? 0),
      currentMonthExpenses: round2(currentMonthAgg._sum.amount ?? 0),
      marketingExpenses: round2(marketingTotal),
      salaryExpenses: round2(salaryTotal),
      otherExpenses: round2(otherTotal),
    },
    categoryBreakdown,
    monthlyTrend,
  });
}
