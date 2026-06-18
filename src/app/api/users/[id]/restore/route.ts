import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

/** Restore a soft-deleted user (clears `deletedAt`). */
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await requirePermission("users", "delete");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const restored = await prisma.user.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(restored);
}
