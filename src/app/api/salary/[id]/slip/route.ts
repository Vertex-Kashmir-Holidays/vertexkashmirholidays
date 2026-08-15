import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, can } from "@/lib/permissions";
import { renderSalarySlipPdf } from "@/lib/salary/salary-slip-pdf";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Salary slip PDF — only for a PAID record. An employee may download their
 * own; a `salary:edit` holder (Finance) may download anyone's. Ownership is
 * enforced here, not left to client-side filtering. */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("salary", "view");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id } = await params;

  const record = await prisma.salaryRecord.findUnique({
    where: { id },
    select: { id: true, employeeId: true, status: true },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isFinance = await can(role, "salary", "edit");
  if (record.employeeId !== userId && !isFinance) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (record.status !== "PAID") {
    return NextResponse.json({ error: "Only a paid salary has a downloadable slip." }, { status: 422 });
  }

  const rendered = await renderSalarySlipPdf(record.id);
  if (!rendered) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(new Uint8Array(rendered.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Vertex-Salary-Slip-${rendered.ref.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
