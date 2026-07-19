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

  const performedByName = session.user?.name ?? session.user?.email ?? "Unknown";

  const restored = await prisma.$transaction(async (tx) => {
    const restoredUser = await tx.user.update({
      where: { id },
      data: { deletedAt: null },
      select: { id: true, name: true, email: true, role: true },
    });
    await tx.auditLog.create({
      data: {
        action: "USER_RESTORE",
        targetUserId: id,
        targetUserName: existing.name,
        targetUserEmail: existing.email,
        performedById: session.user?.id,
        performedByName,
        metadata: { role: existing.role },
      },
    });
    return restoredUser;
  });
  return NextResponse.json(restored);
}
