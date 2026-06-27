import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId } = await params;

  const member = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member || member.leftAt) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const meeting = await prisma.meeting.findFirst({
    where: { roomId, status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      type: true,
      jitsiRoomId: true,
      createdById: true,
      createdAt: true,
      participants: {
        where: { leftAt: null },
        select: {
          userId: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  return NextResponse.json(meeting ?? null);
}
