import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requirePermission("expenses", "view");
  if (guard instanceof NextResponse) return guard;

  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export async function POST(req: NextRequest) {
  const guard = await requirePermission("expenses", "edit");
  if (guard instanceof NextResponse) return guard;

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

  try {
    const category = await prisma.expenseCategory.create({ data: { name: parsed.data.name } });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) {
      return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
