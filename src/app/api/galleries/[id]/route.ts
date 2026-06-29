import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteFromCloudinary } from "@/lib/storage";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  alt: z.string().optional().nullable(),
  caption: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("galleries", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.gallery.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const updated = await prisma.gallery.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("galleries", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await prisma.gallery.findUnique({ where: { id }, select: { id: true, publicId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.gallery.delete({ where: { id } });
  // Best-effort Cloudinary cleanup — row is already gone so we never block on this
  if (existing.publicId) deleteFromCloudinary([existing.publicId]).catch(() => {});
  return NextResponse.json({ success: true });
}
