// Renders a SalaryRecord to a downloadable PDF buffer — same renderToBuffer +
// logo/office-loading pattern as src/lib/bookings/invoice-pdf.tsx. Only PAID
// records may be turned into a slip (see the "no negative status" comment
// below) — enforced by the caller (the API route checks status first).

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { loadLogoDataUrl } from "@/lib/pdf/assets";
import { SalarySlipPdf } from "@/lib/pdf/SalarySlipDocument";
import { resolvePrimaryOffice } from "@/lib/companyOffice";
import { formatSalaryMonthLabel } from "@/lib/salary/month";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export async function renderSalarySlipPdf(
  salaryRecordId: string,
): Promise<{ buffer: Buffer; ref: string } | null> {
  const record = await prisma.salaryRecord.findUnique({
    where: { id: salaryRecordId },
    include: { employee: { select: { name: true, email: true, designation: true, employeeCode: true, joiningDate: true } } },
  });
  if (!record) return null;

  const ref = `${record.employee.name ?? record.employee.email} - ${record.salaryMonth}`;
  const [logo, settings] = await Promise.all([
    loadLogoDataUrl(),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ]);
  const { address } = await resolvePrimaryOffice(settings);

  const buffer = await renderToBuffer(
    <SalarySlipPdf
      logo={logo}
      address={address}
      data={{
        salaryMonthLabel: formatSalaryMonthLabel(record.salaryMonth),
        employeeName: record.employee.name ?? record.employee.email,
        employeeCode: record.employee.employeeCode,
        designation: record.employee.designation,
        joiningDate: record.employee.joiningDate ? fmtDate(record.employee.joiningDate) : null,
        monthlySalary: record.monthlySalary,
        commission: record.commission + record.commissionAdjustment,
        paidDays: record.paidDays,
        absentDays: record.absentDays,
        paidLeaveDays: record.paidLeaveDays,
        unpaidLeaveDays: record.unpaidLeaveDays,
        deductions: record.deductions,
        netSalary: record.netSalary,
        status: record.status,
        paidDate: record.paidAt ? fmtDate(record.paidAt) : null,
        paymentReference: record.paymentReference,
      }}
    />,
  );
  return { buffer, ref };
}
