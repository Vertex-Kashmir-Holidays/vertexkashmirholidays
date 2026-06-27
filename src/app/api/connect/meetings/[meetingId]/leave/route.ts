import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ meetingId: string }> };

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
      participants: { where: { leftAt: null }, select: { userId: true } },
    },
  });
  if (!meeting || meeting.status !== "ACTIVE") {
    return NextResponse.json({ ok: true }); // already ended — silently succeed
  }

  // Mark this participant as left
  await prisma.meetingParticipant.updateMany({
    where: { meetingId, userId, leftAt: null },
    data: { leftAt: new Date() },
  });

  // Auto-end when last active participant leaves
  const remainingOthers = meeting.participants.filter((p) => p.userId !== userId);
  if (remainingOthers.length === 0) {
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: "ENDED", endedAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
