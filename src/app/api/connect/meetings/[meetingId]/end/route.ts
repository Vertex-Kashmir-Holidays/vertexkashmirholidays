import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createSystemMessage } from "@/lib/connect/systemMessage";

type Params = { params: Promise<{ meetingId: string }> };

// Ends the meeting for all participants. Requires creator or room admin.
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      status: true,
      createdById: true,
      roomId: true,
      participants: { select: { userId: true } },
      room: { select: { type: true } },
    },
  });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (meeting.status === "ENDED") {
    return NextResponse.json({ ok: true }); // idempotent
  }

  const isCreator = meeting.createdById === userId;

  if (!isCreator && meeting.roomId) {
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId: meeting.roomId, userId } },
    });
    if (!membership || membership.leftAt) {
      return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
    }
    // In a DIRECT room any member can decline (end) the call.
    // In a GROUP room only the creator (above) or a room admin may end for all.
    if (meeting.room?.type !== "DIRECT" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the meeting creator or a room admin can end a group meeting" },
        { status: 403 },
      );
    }
  } else if (!isCreator) {
    return NextResponse.json(
      { error: "Only the meeting creator can end this meeting" },
      { status: 403 },
    );
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  if (meeting.roomId) {
    const roomType = meeting.room?.type;
    if (roomType === "GROUP") {
      await createSystemMessage(meeting.roomId, meeting.createdById, "Meeting ended");
    } else if (roomType === "DIRECT") {
      const otherJoined = meeting.participants.some((p) => p.userId !== meeting.createdById);
      if (!otherJoined) {
        await createSystemMessage(meeting.roomId, meeting.createdById, "Missed call");
      }
    }
  }

  return NextResponse.json({ ok: true });
}
