import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { prepareSalaryRecord } from "@/lib/salary/prepare";
import { isValidSalaryMonth, isCurrentOrFutureMonth } from "@/lib/salary/month";

export const dynamic = "force-dynamic";

const schema = z.object({
  employeeId: z.string().min(1),
  salaryMonth: z.string().min(1),
});

/** Create the DRAFT payroll record for employee+month — a one-time snapshot
 * (see prepareSalaryRecord). Never runs automatically; Finance triggers it. */
export async function POST(req: NextRequest) {
  const guard = await requirePermission("salary", "edit");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }
  const { employeeId, salaryMonth } = parsed.data;

  if (!isValidSalaryMonth(salaryMonth)) {
    return NextResponse.json({ error: "Invalid salary month." }, { status: 422 });
  }
  if (isCurrentOrFutureMonth(salaryMonth)) {
    return NextResponse.json(
      { error: "Cannot prepare payroll for the current or a future month." },
      { status: 422 },
    );
  }

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, name: true, email: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  try {
    const record = await prepareSalaryRecord(employeeId, salaryMonth);
    await prisma.auditLog.create({
      data: {
        action: "SALARY_PREPARED",
        targetUserId: employee.id,
        targetUserName: employee.name,
        targetUserEmail: employee.email,
        performedById: guard.user.id as string,
        performedByName: (guard.user.name ?? guard.user.email) as string,
        metadata: { salaryMonth, salaryRecordId: record.id, netSalary: record.netSalary },
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) {
      return NextResponse.json(
        { error: "A payroll record already exists for this employee and month." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to prepare payroll." }, { status: 500 });
  }
}
