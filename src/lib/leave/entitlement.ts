// 1.5 paid-leave days/month, 18 days/year, no carry-forward. "Total" is always
// the flat annual policy figure (18); "Remaining" is computed from the
// entitlement actually ACCRUED so far this year, prorated from the employee's
// joining month (an employee who joined in June hasn't accrued the Jan-May
// days, so isn't shown a remaining balance for months before they existed).
// Computed on read — deliberately no stored balance table.
import { prisma } from "@/lib/prisma";
import { salaryMonthRange, parseSalaryMonth, formatSalaryMonth } from "@/lib/salary/month";
import { round2 } from "@/lib/bookings/finance";

export const MONTHLY_PAID_LEAVE_ENTITLEMENT = 1.5;
export const ANNUAL_PAID_LEAVE_ENTITLEMENT = 18;

export interface LeaveBalance {
  total: number; // flat annual policy figure — always 18
  used: number; // approved EARNED/SICK days taken this calendar year to date
  remaining: number; // accrued-to-date entitlement (prorated from joining month) minus used
}

/** `referenceMonth` ("YYYY-MM") is the "as of" point — normally the current
 * month. Balance is computed for the calendar year that month falls in. */
export async function computeLeaveBalance(
  employeeId: string,
  referenceMonth: string,
): Promise<LeaveBalance> {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { joiningDate: true },
  });
  const { year, month } = parseSalaryMonth(referenceMonth);

  // Which month accrual starts in THIS calendar year — the employee's joining
  // month if they joined this year; January if they joined earlier (or their
  // joining date isn't on file, the safe/default assumption); 13 (i.e. zero
  // months accrued yet) if they haven't joined as of this year at all.
  let startMonth = 1;
  if (employee?.joiningDate) {
    const joinYear = employee.joiningDate.getFullYear();
    if (joinYear === year) startMonth = employee.joiningDate.getMonth() + 1;
    else if (joinYear > year) startMonth = 13;
  }

  const monthsAccrued = Math.max(0, Math.min(12, month - startMonth + 1));
  const accruedToDate = round2(monthsAccrued * MONTHLY_PAID_LEAVE_ENTITLEMENT);

  const yearStart = salaryMonthRange(formatSalaryMonth(year, 1)).start;
  const referenceEnd = salaryMonthRange(referenceMonth).end;
  const used = await prisma.leaveRequest.findMany({
    where: {
      employeeId,
      status: "APPROVED",
      type: { in: ["EARNED", "SICK"] },
      startDate: { gte: yearStart, lt: referenceEnd },
    },
    select: { days: true },
  });
  const usedDays = round2(used.reduce((s, l) => s + l.days, 0));
  const remaining = round2(Math.max(0, accruedToDate - usedDays));

  return { total: ANNUAL_PAID_LEAVE_ENTITLEMENT, used: usedDays, remaining };
}
