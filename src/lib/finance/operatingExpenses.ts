// Operating Expenses for the Finance Overview (P&L) — the one place a
// double-count could sneak in, so it's centralized here rather than repeated
// inline in the expenses-summary and overview routes.
//
// Total = Σ Expense.amount (excluding rows that reference a SalaryRecord)
//       + Σ SalaryRecord.netSalary where status = "PAID" and paidAt in range.
//
// An Expense may optionally reference an existing, already-paid SalaryRecord
// (Expense.salaryRecordId) purely for traceability in the Expenses list — that
// money is already counted via the SalaryRecord aggregate below, so including
// the Expense row too would double the same payout. See prisma/schema.prisma
// → Expense doc comment, and .ai instructions on reusing the existing Salary
// module rather than building a second one.

import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/bookings/finance";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface OperatingExpenses {
  expenseTotal: number; // non-salary-linked Expense rows only
  salaryPaidTotal: number; // Σ PAID SalaryRecord.netSalary in range
  total: number;
}

export async function getOperatingExpenses(range: DateRange = {}): Promise<OperatingExpenses> {
  const dateWhere =
    range.from || range.to
      ? { ...(range.from ? { gte: range.from } : {}), ...(range.to ? { lte: range.to } : {}) }
      : undefined;

  const [expenseAgg, salaryAgg] = await Promise.all([
    prisma.expense.aggregate({
      where: {
        deletedAt: null,
        salaryRecordId: null,
        ...(dateWhere ? { date: dateWhere } : {}),
      },
      _sum: { amount: true },
    }),
    prisma.salaryRecord.aggregate({
      where: {
        status: "PAID",
        ...(dateWhere ? { paidAt: dateWhere } : {}),
      },
      _sum: { netSalary: true },
    }),
  ]);

  const expenseTotal = round2(expenseAgg._sum.amount ?? 0);
  const salaryPaidTotal = round2(salaryAgg._sum.netSalary ?? 0);
  return { expenseTotal, salaryPaidTotal, total: round2(expenseTotal + salaryPaidTotal) };
}
