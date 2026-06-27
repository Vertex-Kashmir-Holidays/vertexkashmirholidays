import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ meetingId: string }> };

// Ends the meeting for all participants. Requires creator or room admin.
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "edit");
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
    },
  });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  if (meeting.status === "ENDED") {
    return NextResponse.json({ ok: true }); // idempotent
  }

  const isCreator = meeting.createdById === userId;

  // If not creator, must be a room admin
  if (!isCreator && meeting.roomId) {
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId: meeting.roomId, userId } },
    });
    if (!membership || membership.leftAt || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only the meeting creator or a room admin can end the meeting for all" },
        { status: 403 },
      );
    }
  } else if (!isCreator) {
    return NextResponse.json({ error: "Only the meeting creator can end this meeting" }, { status: 403 });
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
