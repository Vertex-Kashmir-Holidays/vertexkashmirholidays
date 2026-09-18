import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { PAYMENT_METHODS } from "@/lib/payments/gst";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission("expenses", "view");
  if (guard instanceof NextResponse) return guard;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const paymentMethod = searchParams.get("paymentMethod") ?? undefined;
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sortBy = searchParams.get("sortBy") === "amount" ? "amount" : "date";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20")));
  const skip = (page - 1) * take;

  const where: Prisma.ExpenseWhereInput = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(paymentMethod ? { paymentMethod } : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: "insensitive" } },
            { reference: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      take,
      skip,
      select: {
        id: true,
        date: true,
        amount: true,
        description: true,
        paymentMethod: true,
        reference: true,
        notes: true,
        salaryRecordId: true,
        createdAt: true,
        category: { select: { id: true, name: true, isSystem: true } },
        employee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({ expenses: rows, total, page, pages: Math.ceil(total / take) });
}

const createSchema = z.object({
  date: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().trim().max(300).optional(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  employeeId: z.string().min(1).optional(),
  salaryRecordId: z.string().min(1).optional(),
  reference: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const guard = await requirePermission("expenses", "create");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }
  const d = parsed.data;
  const date = new Date(d.date);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Enter a valid expense date." }, { status: 422 });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        date,
        categoryId: d.categoryId,
        description: d.description ?? null,
        amount: d.amount,
        paymentMethod: d.paymentMethod ?? null,
        employeeId: d.employeeId ?? null,
        salaryRecordId: d.salaryRecordId ?? null,
        reference: d.reference ?? null,
        notes: d.notes ?? null,
        createdById: userId,
      },
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2003")) {
      return NextResponse.json({ error: "The selected category, employee, or salary record doesn't exist." }, { status: 422 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
