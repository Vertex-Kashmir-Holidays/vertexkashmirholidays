import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteFromCloudinary } from "@/lib/storage";
import { parseJsonBody, parseWithSchema, requireExisting } from "@/lib/api/route-helpers";
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
  const existing = await requireExisting(() => prisma.gallery.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(patchSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const updated = await prisma.gallery.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("galleries", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() =>
    prisma.gallery.findUnique({ where: { id }, select: { id: true, publicId: true } }),
  );
  if (!existing.ok) return existing.response;
  await prisma.gallery.delete({ where: { id } });
  // Best-effort Cloudinary cleanup — row is already gone so we never block on this
  if (existing.data.publicId) deleteFromCloudinary([existing.data.publicId]).catch(() => {});
  return NextResponse.json({ success: true });
}
