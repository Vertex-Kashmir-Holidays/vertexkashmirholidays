import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "edit");
  if (guard instanceof NextResponse) return guard;
  const myId = guard.user.id;
  const { id: roomId } = await params;

  const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
  if (!room || room.type !== "GROUP") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const myMembership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: myId } },
  });
  if (!myMembership || myMembership.leftAt) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }
  if (myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Only group admins can update the group" }, { status: 403 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updates: { name?: string; avatarUrl?: string | null } = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  const updated = await prisma.chatRoom.update({
    where: { id: roomId },
    data: updates,
    select: { id: true, name: true, avatarUrl: true },
  });

  // Notify all other members if the group was renamed
  if (body.name !== undefined && body.name !== room.name) {
    const otherMembers = await prisma.chatMember.findMany({
      where: { roomId, userId: { not: myId }, leftAt: null },
      select: { userId: true },
    });
    const actorName = guard.user.name ?? "A group admin";
    const oldName = room.name ?? "the group";
    await Promise.all(
      otherMembers.map((m) =>
        createNotification({
          userId: m.userId,
          type: "CHAT_GROUP_UPDATED",
          title: "Group renamed",
          body: `${actorName} renamed "${oldName}" to "${body.name}"`,
          link: `/admin/connect?room=${roomId}`,
        }),
      ),
    );
  }

  return NextResponse.json(updated);
}
