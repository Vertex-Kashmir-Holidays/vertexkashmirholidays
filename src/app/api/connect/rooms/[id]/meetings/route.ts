import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { createSystemMessage } from "@/lib/connect/systemMessage";

type Params = { params: Promise<{ id: string }> };

const meetingSelect = {
  id: true,
  title: true,
  type: true,
  jitsiRoomId: true,
  createdById: true,
  status: true,
  createdAt: true,
  endedAt: true,
  participants: {
    where: { leftAt: null },
    select: {
      userId: true,
      joinedAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  },
} as const;

// GET — meeting history for a room
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

  const meetings = await prisma.meeting.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      createdAt: true,
      endedAt: true,
      createdBy: { select: { id: true, name: true, image: true } },
      participants: {
        select: { userId: true, user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return NextResponse.json(meetings);
}

// POST — start a new meeting in this room
export async function POST(req: NextRequest, { params }: Params) {
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

  // Prevent duplicate active meetings per room
  const existing = await prisma.meeting.findFirst({
    where: { roomId, status: "ACTIVE" },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "There is already an active meeting in this room", meetingId: existing.id },
      { status: 409 },
    );
  }

  const json = await req.json().catch(() => ({}));
  const type: "AUDIO" | "VIDEO" = json.type === "VIDEO" ? "VIDEO" : "AUDIO";

  // Cryptographically random Jitsi room ID — hard to guess
  const jitsiRoomId = `vkh-${randomBytes(12).toString("hex")}`;

  const [meeting, room] = await Promise.all([
    prisma.meeting.create({
      data: {
        roomId,
        title: type === "VIDEO" ? "Video meeting" : "Audio meeting",
        type,
        jitsiRoomId,
        createdById: userId,
        status: "ACTIVE",
        participants: { create: { userId, joinedAt: new Date() } },
      },
      select: meetingSelect,
    }),
    prisma.chatRoom.findUnique({ where: { id: roomId }, select: { type: true } }),
  ]);

  if (room?.type === "GROUP") {
    await createSystemMessage(roomId, userId, "Meeting started");
  }

  // Notify other room members
  const others = await prisma.chatMember.findMany({
    where: { roomId, userId: { not: userId }, leftAt: null },
    select: { userId: true },
  });
  const senderName = guard.user.name ?? "A colleague";
  await Promise.all(
    others.map((m) =>
      createNotification({
        userId: m.userId,
        type: "CHAT_MEETING_STARTED",
        title: `${senderName} started a ${type.toLowerCase()} meeting`,
        body: "Tap to join",
        link: `/admin/connect?room=${roomId}`,
      }),
    ),
  );

  return NextResponse.json(meeting, { status: 201 });
}
