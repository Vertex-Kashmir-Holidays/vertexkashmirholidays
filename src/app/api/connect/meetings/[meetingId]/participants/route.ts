import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ meetingId: string }> };

// Lightweight endpoint polled by MeetingModal to detect:
//  - when a remote participant joins (fires the 30s no-answer timer cancellation)
//  - when the meeting is ended by someone else (auto-closes the modal)
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const { meetingId } = await params;

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      status: true,
      participants: {
        where: { leftAt: null },
        select: { userId: true },
      },
    },
  });

  if (!meeting) return NextResponse.json({ active: false, count: 0 });

  return NextResponse.json({
    active: meeting.status === "ACTIVE",
    count: meeting.participants.length,
  });
}
