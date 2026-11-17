import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { deleteFromCloudinary } from "@/lib/storage";

type Params = { params: Promise<{ id: string; docId: string }> };

/** Remove a document shared with this agent (it disappears from their portal). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bAgents", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id, docId } = await params;

  const doc = await prisma.adminDocument.findFirst({
    where: { id: docId, agentId: id },
    select: { id: true, publicId: true },
  });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  await prisma.adminDocument.delete({ where: { id: doc.id } });
  // Best-effort file cleanup — the row is already gone.
  if (doc.publicId) deleteFromCloudinary([doc.publicId]).catch(() => {});
  return NextResponse.json({ ok: true });
}
