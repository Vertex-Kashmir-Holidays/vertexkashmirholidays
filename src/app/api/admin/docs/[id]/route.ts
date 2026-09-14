import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteFromCloudinary } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const guard = await requirePermission("docs", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const doc = await prisma.adminDocument.findUnique({ where: { id }, select: { publicId: true } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (doc.publicId) await deleteFromCloudinary([doc.publicId]);
  await prisma.adminDocument.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
