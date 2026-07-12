import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ userId: string }> };

const DM_INCLUDE = {
  members: {
    where: { leftAt: null },
    include: { user: { select: { id: true, name: true, image: true } } },
  },
} as const;

export async function POST(_req: Request, { params }: Params) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const { userId: targetId } = await params;
  const myId = guard.user.id;

  if (myId === targetId) {
    return NextResponse.json({ error: "Cannot start a chat with yourself" }, { status: 400 });
  }

  // Sorted key ensures the same two users always map to the same key regardless of who initiates
  const directKey = [myId, targetId].sort().join(":");

  // Fast-path: room already exists
  const existing = await prisma.chatRoom.findUnique({
    where: { directKey },
    include: {
      ...DM_INCLUDE,
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });
  if (existing) {
    // Re-admit the initiator if they previously deleted the chat (leftAt was set)
    const myMember = existing.members.find((m) => m.userId === myId);
    let mutated = false;
    if (myMember?.leftAt) {
      await prisma.chatMember.update({
        where: { id: myMember.id },
        data: { leftAt: null },
      });
      mutated = true;
    }
    // Re-admit the target too if they had left
    const theirMember = existing.members.find((m) => m.userId === targetId);
    if (theirMember?.leftAt) {
      await prisma.chatMember.update({
        where: { id: theirMember.id },
        data: { leftAt: null },
      });
      mutated = true;
    }
    // Only the common "nothing changed" path skips a second query — if a
    // member was actually re-admitted above, the DM_INCLUDE members filter
    // (leftAt: null) means our already-fetched `existing` is stale for them.
    if (!mutated) {
      return NextResponse.json({
        ...existing,
        members: existing.members.filter((m) => !m.leftAt),
      });
    }
    const refreshed = await prisma.chatRoom.findUnique({ where: { directKey }, include: DM_INCLUDE });
    return NextResponse.json(refreshed);
  }

  // Create — if a concurrent request races us here, the unique constraint fires (P2002)
  try {
    const room = await prisma.chatRoom.create({
      data: {
        type: "DIRECT",
        directKey,
        createdById: myId,
        members: {
          create: [{ userId: myId }, { userId: targetId }],
        },
      },
      include: DM_INCLUDE,
    });
    return NextResponse.json(room, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) {
      // Race condition — another request created the room between our findUnique and create
      const race = await prisma.chatRoom.findUnique({ where: { directKey }, include: DM_INCLUDE });
      if (race) return NextResponse.json(race);
    }
    throw err;
  }
}
