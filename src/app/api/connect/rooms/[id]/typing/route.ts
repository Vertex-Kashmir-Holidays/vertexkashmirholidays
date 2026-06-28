import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId } = await params;

  const member = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member || member.leftAt) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  await prisma.chatMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { typingAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
