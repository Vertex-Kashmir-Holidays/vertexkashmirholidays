import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;

  const { searchParams } = new URL(req.url);
  const showArchived = searchParams.get("archived") === "true";

  const memberships = await prisma.chatMember.findMany({
    where: {
      userId,
      leftAt: null,
      room: { archivedAt: showArchived ? { not: null } : null },
    },
    select: {
      lastReadAt: true,
      role: true,
      room: {
        select: {
          id: true,
          type: true,
          name: true,
          avatarUrl: true,
          archivedAt: true,
          createdAt: true,
          updatedAt: true,
          members: {
            where: { leftAt: null },
            select: {
              userId: true,
              role: true,
              lastReadAt: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, body: true, attachmentName: true, createdAt: true, senderId: true },
          },
        },
      },
    },
  });

  const withUnread = await Promise.all(
    memberships.map(async (m) => {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          roomId: m.room.id,
          senderId: { not: userId },
          deletedAt: null,
          createdAt: { gt: m.lastReadAt ?? new Date(0) },
        },
      });
      return { ...m.room, myRole: m.role, unreadCount };
    }),
  );

  withUnread.sort((a, b) => {
    const aTime = a.messages[0]?.createdAt ?? a.createdAt;
    const bTime = b.messages[0]?.createdAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return NextResponse.json(withUnread);
}

const createGroupSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  memberIds: z.array(z.string().cuid()).min(1).max(18),
  avatarUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const myId = guard.user.id;

  let body: z.infer<typeof createGroupSchema>;
  try {
    body = createGroupSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, memberIds, avatarUrl } = body;

  // Deduplicate and exclude self (creator is added as ADMIN separately)
  const otherIds = [...new Set(memberIds.filter((id) => id !== myId))];

  const room = await prisma.chatRoom.create({
    data: {
      type: "GROUP",
      name,
      avatarUrl: avatarUrl ?? null,
      createdById: myId,
      members: {
        create: [
          { userId: myId, role: "ADMIN" },
          ...otherIds.map((id) => ({ userId: id, role: "MEMBER" as const })),
        ],
      },
    },
    select: {
      id: true,
      type: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      members: {
        where: { leftAt: null },
        select: {
          userId: true,
          role: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  return NextResponse.json(room, { status: 201 });
}
