import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

type Params = { params: Promise<{ id: string; userId: string }> };

// DELETE — remove a member from a group, or leave the group (self)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "edit");
  if (guard instanceof NextResponse) return guard;
  const myId = guard.user.id;
  const { id: roomId, userId: targetId } = await params;

  const isSelf = myId === targetId;

  const myMembership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: myId } },
  });
  if (!myMembership || myMembership.leftAt) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }
  if (!isSelf && myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Only group admins can remove members" }, { status: 403 });
  }

  const targetMembership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: targetId } },
  });
  if (!targetMembership || targetMembership.leftAt) {
    return NextResponse.json({ error: "User is not an active member" }, { status: 404 });
  }

  // Last-admin guard
  if (targetMembership.role === "ADMIN") {
    const remainingAdmins = await prisma.chatMember.count({
      where: { roomId, role: "ADMIN", leftAt: null, userId: { not: targetId } },
    });
    if (remainingAdmins === 0) {
      return NextResponse.json(
        {
          error: isSelf
            ? "You are the last admin. Promote another member to admin before leaving."
            : "Cannot remove the last group admin. Assign another admin first.",
        },
        { status: 409 },
      );
    }
  }

  await prisma.chatMember.update({
    where: { id: targetMembership.id },
    data: { leftAt: new Date() },
  });

  if (!isSelf) {
    const actorName = guard.user.name ?? "A group admin";
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, select: { name: true } });
    await createNotification({
      userId: targetId,
      type: "CHAT_MEMBER_REMOVED",
      title: "Removed from group",
      body: `${actorName} removed you from "${room?.name ?? "a group"}"`,
      link: `/admin/connect`,
    });
  }

  return NextResponse.json({ ok: true });
}

// PATCH — promote or demote a member's role (ADMIN only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "edit");
  if (guard instanceof NextResponse) return guard;
  const myId = guard.user.id;
  const { id: roomId, userId: targetId } = await params;

  const myMembership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: myId } },
  });
  if (!myMembership || myMembership.leftAt || myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Only group admins can change member roles" }, { status: 403 });
  }

  let body: { role: "MEMBER" | "ADMIN" };
  try {
    body = z.object({ role: z.enum(["MEMBER", "ADMIN"]) }).parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const targetMembership = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId: targetId } },
  });
  if (!targetMembership || targetMembership.leftAt) {
    return NextResponse.json({ error: "User is not an active member" }, { status: 404 });
  }

  // Demoting the last admin is forbidden
  if (body.role === "MEMBER" && targetMembership.role === "ADMIN") {
    const remainingAdmins = await prisma.chatMember.count({
      where: { roomId, role: "ADMIN", leftAt: null, userId: { not: targetId } },
    });
    if (remainingAdmins === 0) {
      return NextResponse.json(
        { error: "Cannot demote the last group admin. Promote another member first." },
        { status: 409 },
      );
    }
  }

  await prisma.chatMember.update({
    where: { id: targetMembership.id },
    data: { role: body.role },
  });

  const actorName = guard.user.name ?? "A group admin";
  const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, select: { name: true } });
  const isPromotion = body.role === "ADMIN";
  await createNotification({
    userId: targetId,
    type: isPromotion ? "CHAT_MEMBER_PROMOTED" : "CHAT_MEMBER_DEMOTED",
    title: isPromotion ? "You are now a group admin" : "Group admin role removed",
    body: isPromotion
      ? `${actorName} promoted you to admin in "${room?.name ?? "a group"}"`
      : `${actorName} removed your admin role in "${room?.name ?? "a group"}"`,
    link: `/admin/connect?room=${roomId}`,
  });

  return NextResponse.json({ ok: true });
}
