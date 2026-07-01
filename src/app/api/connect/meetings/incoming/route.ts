import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// Returns the first active meeting in any room the current user is a member of
// where the user is NOT currently an active participant.
// Used by GlobalCallNotification to ring the user from anywhere in the admin.
export async function GET() {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;

  const meeting = await prisma.meeting.findFirst({
    where: {
      status: "ACTIVE",
      room: {
        members: { some: { userId, leftAt: null } },
      },
      NOT: {
        participants: { some: { userId } },
      },
    },
    select: {
      id: true,
      title: true,
      type: true,
      jitsiRoomId: true,
      createdById: true,
      roomId: true,
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

  return NextResponse.json(meeting ?? null);
}
