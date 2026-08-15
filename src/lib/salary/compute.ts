// Single authoritative net-salary formula. Reused by prepare/edit routes and
// the PDF — never re-derive this inline elsewhere.
import { round2 } from "@/lib/bookings/finance";

export interface SalaryInputs {
  monthlySalary: number;
  commission: number;
  commissionAdjustment: number;
  deductions: number;
}

export function computeNetSalary(input: SalaryInputs): number {
  return round2(
    input.monthlySalary + input.commission + input.commissionAdjustment - input.deductions,
  );
}
