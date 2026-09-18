import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { PAYMENT_METHODS } from "@/lib/payments/gst";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("expenses", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: { select: { id: true, name: true, isSystem: true } },
      employee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      salaryRecord: { select: { id: true, salaryMonth: true, netSalary: true, status: true } },
    },
  });
  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  return NextResponse.json(expense);
}

const patchSchema = z.object({
  date: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().trim().max(300).optional().nullable(),
  amount: z.coerce.number().positive().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
  employeeId: z.string().min(1).optional().nullable(),
  salaryRecordId: z.string().min(1).optional().nullable(),
  reference: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("expenses", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }
  const { date, ...rest } = parsed.data;
  if (date) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Enter a valid expense date." }, { status: 422 });
    }
  }

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
    return NextResponse.json(expense);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2025")) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    if (msg.includes("P2003")) {
      return NextResponse.json({ error: "The selected category, employee, or salary record doesn't exist." }, { status: 422 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("expenses", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  try {
    await prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2025")) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
