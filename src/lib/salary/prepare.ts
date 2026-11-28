// Prepares (creates) a DRAFT SalaryRecord for employee+month: snapshots the
// employee's current monthlySalary, claims their unclaimed EARNED
// BookingCommission rows up to the end of the month (earned = tour completed
// and fully paid; claiming means the same commission is never counted in two
// different months' payroll — see BookingCommission.salaryRecordId),
// and pre-fills paid/unpaid leave days from APPROVED LeaveRequest rows. Nothing
// here re-runs automatically later — it's a one-time snapshot, exactly the
// "do not dynamically recalculate an already prepared payroll" rule.

import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/bookings/finance";
import { salaryMonthRange } from "@/lib/salary/month";
import { computeNetSalary } from "@/lib/salary/compute";
import { refreshOpenCommissions } from "@/lib/bookings/commissionSync";

export async function prepareSalaryRecord(employeeId: string, salaryMonth: string) {
  const { start, end } = salaryMonthRange(salaryMonth);
  // Tours that completed since their last edit become EARNED now (see
  // commissionSync.ts). Runs before — not inside — the payroll transaction.
  await refreshOpenCommissions(prisma, employeeId);

  return prisma.$transaction(async (tx) => {
    const employee = await tx.user.findUnique({
      where: { id: employeeId },
      select: { monthlySalary: true },
    });
    if (!employee) throw new Error("Employee not found");

    const claimable = await tx.bookingCommission.findMany({
      where: {
        employeeId,
        status: "EARNED",
        salaryRecordId: null,
        // Earned in this month (tour completed in it) — plus any earlier
        // earned incentive no previous payroll claimed, so none is ever lost.
        earnedAt: { lt: end },
      },
      select: { id: true, commissionAmount: true },
    });
    const commission = round2(claimable.reduce((s, c) => s + c.commissionAmount, 0));

    // Leave is attributed entirely to its startDate's month — a request
    // spanning a month boundary isn't split across two payrolls.
    const leaves = await tx.leaveRequest.findMany({
      where: { employeeId, status: "APPROVED", startDate: { gte: start, lt: end } },
      select: { type: true, days: true },
    });
    const paidLeaveDays = round2(
      leaves.filter((l) => l.type !== "UNPAID").reduce((s, l) => s + l.days, 0),
    );
    const unpaidLeaveDays = round2(
      leaves.filter((l) => l.type === "UNPAID").reduce((s, l) => s + l.days, 0),
    );

    const monthlySalary = employee.monthlySalary ?? 0;
    const netSalary = computeNetSalary({
      monthlySalary,
      commission,
      commissionAdjustment: 0,
      deductions: 0,
    });

    const record = await tx.salaryRecord.create({
      data: {
        employeeId,
        salaryMonth,
        monthlySalary,
        commission,
        paidLeaveDays,
        unpaidLeaveDays,
        netSalary,
      },
    });

    if (claimable.length) {
      await tx.bookingCommission.updateMany({
        where: { id: { in: claimable.map((c) => c.id) } },
        data: { salaryRecordId: record.id },
      });
    }

    return record;
  });
}
