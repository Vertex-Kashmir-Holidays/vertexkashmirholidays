import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createSystemMessage } from "@/lib/connect/systemMessage";

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
      room: { select: { type: true } },
      participants: {
        where: { leftAt: null },
        select: {
          userId: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  // Auto-end orphaned meetings (all participants left without hitting the end route)
  if (meeting && meeting.participants.length === 0) {
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: "ENDED", endedAt: new Date() },
    });

    const roomType = meeting.room?.type;
    if (roomType === "GROUP") {
      await createSystemMessage(roomId, meeting.createdById, "Meeting ended");
    } else if (roomType === "DIRECT") {
      const allParticipants = await prisma.meetingParticipant.findMany({
        where: { meetingId: meeting.id },
        select: { userId: true },
      });
      const otherJoined = allParticipants.some((p) => p.userId !== meeting.createdById);
      if (!otherJoined) {
        await createSystemMessage(roomId, meeting.createdById, "Missed call");
      }
    }

    return NextResponse.json(null);
  }

  return NextResponse.json(meeting ?? null);
}
