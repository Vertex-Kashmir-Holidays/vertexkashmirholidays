import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { adventureSchema } from "@/lib/admin/adventureSchema";
import { invalidateAdventure } from "@/lib/cache";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("adventures", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.adventure.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adventureSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const updated = await prisma.adventure.update({ where: { id }, data: parsed.data });
    invalidateAdventure({ slug: updated.slug, previousSlug: existing.slug });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002"))
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("adventures", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.adventure.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.adventure.delete({ where: { id } });
  invalidateAdventure({ slug: existing.slug });
  return NextResponse.json({ success: true });
}
