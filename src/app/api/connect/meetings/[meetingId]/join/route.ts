import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ meetingId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: { id: true, roomId: true, status: true, jitsiRoomId: true, type: true },
  });
  if (!meeting || meeting.status !== "ACTIVE") {
    return NextResponse.json({ error: "Meeting not found or already ended" }, { status: 404 });
  }

  // Verify room membership when the meeting is tied to a room
  if (meeting.roomId) {
    const member = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId: meeting.roomId, userId } },
    });
    if (!member || member.leftAt) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
    }
  }

  // Upsert participant — re-join if previously left
  await prisma.meetingParticipant.upsert({
    where: { meetingId_userId: { meetingId, userId } },
    update: { leftAt: null, joinedAt: new Date() },
    create: { meetingId, userId, joinedAt: new Date() },
  });

  return NextResponse.json({ ok: true, jitsiRoomId: meeting.jitsiRoomId, type: meeting.type });
}
