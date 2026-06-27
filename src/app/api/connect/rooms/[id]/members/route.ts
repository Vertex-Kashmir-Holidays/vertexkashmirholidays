import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const addSchema = z.object({ userId: z.string().cuid() });

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const myId = guard.user.id;
  const { id: roomId } = await params;

  const myMembership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: myId } },
  });
  if (!myMembership || myMembership.leftAt || myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Only group admins can add members" }, { status: 403 });
  }

  const room = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: { id: true, type: true, name: true },
  });
  if (!room || room.type !== "GROUP") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  let body: z.infer<typeof addSchema>;
  try {
    body = addSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { userId: targetId } = body;

  const existing = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: targetId } },
  });

  if (existing && !existing.leftAt) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  const actorName = guard.user.name ?? "A group admin";
  const groupName = room.name ?? "a group";

  if (existing && existing.leftAt) {
    // Re-activate a previously left member
    await prisma.chatMember.update({
      where: { id: existing.id },
      data: { leftAt: null, role: "MEMBER" },
    });
  } else {
    await prisma.chatMember.create({
      data: { roomId, userId: targetId, role: "MEMBER" },
    });
  }

  await createNotification({
    userId: targetId,
    type: "CHAT_MEMBER_ADDED",
    title: "Added to group",
    body: `${actorName} added you to "${groupName}"`,
    link: `/admin/connect?room=${roomId}`,
  });

  const member = await prisma.chatMember.findUniqueOrThrow({
    where: { roomId_userId: { roomId, userId: targetId } },
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}
