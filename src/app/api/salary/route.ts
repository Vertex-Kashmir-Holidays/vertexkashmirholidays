import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, can } from "@/lib/permissions";
import { isValidSalaryMonth, previousCompletedMonth } from "@/lib/salary/month";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * Self-service by default: any staff member gets their own record for the
 * month (never another employee's — enforced by scoping the query to their
 * own id, not by filtering a broader result client-side). Only a user holding
 * `salary:edit` (the "Finance" capability) gets the org-wide table.
 */
export async function GET(req: NextRequest) {
  const guard = await requirePermission("salary", "view");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? previousCompletedMonth();
  if (!isValidSalaryMonth(month)) {
    return NextResponse.json({ error: "Invalid month." }, { status: 400 });
  }

  const isFinance = await can(role, "salary", "edit");

  if (!isFinance) {
    // Self-service: full month-wise history, not just one month — the
    // employee's "Salary" page is a history list, not a single-period table.
    // DRAFT is Finance-internal (not yet ready for the employee to see).
    const records = await prisma.salaryRecord.findMany({
      where: { employeeId: userId, status: { in: ["REVIEW", "PAID"] } },
      orderBy: { salaryMonth: "desc" },
      take: 24,
    });
    return NextResponse.json({ month, isFinance: false, records });
  }

  const employees = await prisma.user.findMany({
    where: { role: { in: ["SUPERADMIN", "ADMIN", "SALES", "EDITOR"] }, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
      employeeCode: true,
      monthlySalary: true,
    },
    orderBy: { name: "asc" },
  });
  const records = await prisma.salaryRecord.findMany({ where: { salaryMonth: month } });
  const byEmployee = new Map(records.map((r) => [r.employeeId, r]));

  const rows = employees.map((e) => ({ employee: e, record: byEmployee.get(e.id) ?? null }));
  return NextResponse.json({ month, isFinance: true, rows });
}
