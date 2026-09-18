import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(60),
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

  try {
    const category = await prisma.expenseCategory.update({
      where: { id },
      data: { name: parsed.data.name },
    });
    return NextResponse.json(category);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) {
      return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
    }
    if (msg.includes("P2025")) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("expenses", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const category = await prisma.expenseCategory.findUnique({
    where: { id },
    select: { isSystem: true, _count: { select: { expenses: true } } },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }
  if (category.isSystem) {
    return NextResponse.json({ error: "This category is required by the system and can't be deleted." }, { status: 409 });
  }
  if (category._count.expenses > 0) {
    return NextResponse.json({ error: "This category still has expenses recorded against it." }, { status: 409 });
  }

  await prisma.expenseCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
