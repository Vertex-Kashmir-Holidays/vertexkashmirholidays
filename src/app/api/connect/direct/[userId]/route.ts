import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ userId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const { userId: targetId } = await params;
  const myId = guard.user.id;

  if (myId === targetId) {
    return NextResponse.json({ error: "Cannot start a chat with yourself" }, { status: 400 });
  }

  const existing = await prisma.chatRoom.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId: myId, leftAt: null } } },
        { members: { some: { userId: targetId, leftAt: null } } },
      ],
    },
    include: {
      members: {
        where: { leftAt: null },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (existing) return NextResponse.json(existing);

  const room = await prisma.chatRoom.create({
    data: {
      type: "DIRECT",
      createdById: myId,
      members: {
        create: [{ userId: myId }, { userId: targetId }],
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return NextResponse.json(room, { status: 201 });
}
