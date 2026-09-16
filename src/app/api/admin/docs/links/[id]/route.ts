import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { docLinkPatchSchema } from "@/lib/docs/linkSchema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("docs", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = docLinkPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const existing = await prisma.adminDocLink.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.adminDocLink.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const guard = await requirePermission("docs", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const existing = await prisma.adminDocLink.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.adminDocLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
