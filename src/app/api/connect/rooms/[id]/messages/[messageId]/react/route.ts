import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; messageId: string }> };

type ReactionMap = Record<string, string[]>;

const msgSelect = {
  id: true,
  roomId: true,
  senderId: true,
  body: true,
  attachmentUrl: true,
  attachmentPublicId: true,
  attachmentType: true,
  attachmentName: true,
  editedAt: true,
  deletedAt: true,
  reactions: true,
  createdAt: true,
  updatedAt: true,
  sender: { select: { id: true, name: true, image: true } },
} as const;

/** POST — toggle a reaction. One reaction per user: clicking same removes it, clicking different replaces it. */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId, messageId } = await params;

  const member = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member || member.leftAt) {
    return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
  }

  let emoji: string;
  try {
    const json = await req.json();
    emoji = typeof json.emoji === "string" ? json.emoji.trim() : "";
    if (!emoji) throw new Error("empty");
  } catch {
    return NextResponse.json({ error: "emoji is required" }, { status: 400 });
  }

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.roomId !== roomId || message.deletedAt) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const map: ReactionMap = (() => {
    try {
      return message.reactions ? (JSON.parse(message.reactions) as ReactionMap) : {};
    } catch {
      return {};
    }
  })();

  // Find and remove user's current reaction (if any)
  let currentEmoji: string | null = null;
  for (const [e, users] of Object.entries(map)) {
    if (users.includes(userId)) {
      currentEmoji = e;
      break;
    }
  }
  if (currentEmoji) {
    map[currentEmoji] = map[currentEmoji].filter((u) => u !== userId);
    if (map[currentEmoji].length === 0) delete map[currentEmoji];
  }

  // If clicking a different (or new) emoji, add user to it
  if (currentEmoji !== emoji) {
    map[emoji] = [...(map[emoji] ?? []), userId];
  }

  const updated = await prisma.chatMessage.update({
    where: { id: messageId },
    data: { reactions: Object.keys(map).length ? JSON.stringify(map) : null },
    select: msgSelect,
  });

  return NextResponse.json(updated);
}
