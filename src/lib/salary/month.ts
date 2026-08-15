// salaryMonth is always a "YYYY-MM" string representing a calendar month —
// never a Date/timestamp. All month-boundary math here is done in IST (fixed
// UTC+5:30, no DST) so a booking/leave dated "just after midnight IST" isn't
// miscounted into the previous UTC day's month.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function formatSalaryMonth(year: number, month1to12: number): string {
  return `${year}-${String(month1to12).padStart(2, "0")}`;
}

export function parseSalaryMonth(salaryMonth: string): { year: number; month: number } {
  const [y, m] = salaryMonth.split("-").map(Number);
  return { year: y, month: m };
}

export function isValidSalaryMonth(salaryMonth: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(salaryMonth)) return false;
  const { year } = parseSalaryMonth(salaryMonth);
  return year >= 2000 && year <= 2100;
}

/** "2026-08" -> "August 2026" for display. */
export function formatSalaryMonthLabel(salaryMonth: string): string {
  const { year, month } = parseSalaryMonth(salaryMonth);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** The most recently COMPLETED calendar month, in IST. Salary is paid 7th-10th
 * of the following month for the previous completed month — the current,
 * still-in-progress month is never payable. */
export function previousCompletedMonth(now: Date = new Date()): string {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const y = istNow.getUTCFullYear();
  const m = istNow.getUTCMonth(); // 0-indexed current IST month
  const prev = new Date(Date.UTC(y, m - 1, 1));
  return formatSalaryMonth(prev.getUTCFullYear(), prev.getUTCMonth() + 1);
}

/** The current (in-progress) calendar month, in IST — used by leave (forward-
 * looking entitlement), unlike payroll which always looks at completed months. */
export function currentIstMonth(now: Date = new Date()): string {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  return formatSalaryMonth(istNow.getUTCFullYear(), istNow.getUTCMonth() + 1);
}

/** True if `salaryMonth` is the current (incomplete) or a future IST month —
 * i.e. not yet payable. */
export function isCurrentOrFutureMonth(salaryMonth: string, now: Date = new Date()): boolean {
  return salaryMonth >= currentIstMonth(now);
}

/** [start, end) as UTC instants corresponding to IST midnight on the 1st of
 * `salaryMonth` and IST midnight on the 1st of the following month — safe to
 * use directly in Prisma `gte`/`lt` filters against DateTime columns. */
export function salaryMonthRange(salaryMonth: string): { start: Date; end: Date } {
  const { year, month } = parseSalaryMonth(salaryMonth);
  const start = new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS);
  const end = new Date(Date.UTC(year, month, 1) - IST_OFFSET_MS);
  return { start, end };
}
