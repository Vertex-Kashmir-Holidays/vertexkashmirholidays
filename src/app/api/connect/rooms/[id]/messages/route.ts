import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

const SITE_HOST = (() => {
  try { return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://vertexkashmirholidays.com").hostname; } catch { return "vertexkashmirholidays.com"; }
})();

function isValidAttachmentUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (
      u.hostname === "res.cloudinary.com" || u.hostname === SITE_HOST
    );
  } catch { return false; }
}

type Params = { params: Promise<{ id: string }> };

const LIMIT = 50;

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

async function getTypingMembers(roomId: string, userId: string) {
  const fiveSecsAgo = new Date(Date.now() - 5_000);
  const typingMembers = await prisma.chatMember.findMany({
    where: {
      roomId,
      userId: { not: userId },
      leftAt: null,
      typingAt: { gt: fiveSecsAgo },
    },
    select: { user: { select: { id: true, name: true } } },
  });
  return typingMembers.map((m) => ({ id: m.user.id, name: m.user.name }));
}

export async function GET(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId } = await params;

  const member = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member || member.leftAt) {
    return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const before = searchParams.get("before");
  const since = searchParams.get("since");

  if (since) {
    const sinceDate = new Date(since);
    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId,
        OR: [
          { createdAt: { gt: sinceDate }, deletedAt: null },
          { editedAt: { gt: sinceDate } },
          { deletedAt: { gt: sinceDate } },
          { updatedAt: { gt: sinceDate } }, // catches reaction changes
        ],
      },
      orderBy: { createdAt: "asc" },
      select: msgSelect,
    });
    const typing = await getTypingMembers(roomId, userId);
    return NextResponse.json({ messages, hasMore: false, typing });
  }

  const q = searchParams.get("q")?.trim();
  if (q) {
    const results = await prisma.chatMessage.findMany({
      where: {
        roomId,
        deletedAt: null,
        body: { contains: q, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: msgSelect,
    });
    return NextResponse.json({ messages: results, hasMore: false, typing: [] });
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId,
      deletedAt: null,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: LIMIT + 1,
    select: msgSelect,
  });

  const hasMore = messages.length > LIMIT;
  if (hasMore) messages.pop();
  messages.reverse();

  const typing = await getTypingMembers(roomId, userId);
  return NextResponse.json({ messages, hasMore, typing });
}

// ─── Mention helpers ────────────────────────────────────────────────────────

const BLOCKED_SLUGS = new Set(["everyone", "here"]);

/** First word of a display name, lowercased — the "slug" used for @mention matching. */
function nameSlug(name: string): string {
  return name.trim().split(/\s+/)[0].toLowerCase();
}

/**
 * Parse @token patterns from body, resolve to room-member userIds.
 * Returns a deduplicated list of userIds that were mentioned (excludes sender).
 */
function resolveMentions(
  body: string,
  members: Array<{ userId: string; user: { name: string | null } }>,
): string[] {
  const tokens = new Set<string>();
  for (const [, token] of body.matchAll(/@([A-Za-z0-9_.]+)/g)) {
    const lower = token.toLowerCase();
    if (!BLOCKED_SLUGS.has(lower)) tokens.add(lower);
  }
  if (tokens.size === 0) return [];

  // Build slug → userIds (one slug may match multiple users with the same first name)
  const slugMap = new Map<string, string[]>();
  for (const m of members) {
    if (!m.user.name) continue;
    const slug = nameSlug(m.user.name);
    const bucket = slugMap.get(slug) ?? [];
    bucket.push(m.userId);
    slugMap.set(slug, bucket);
  }

  const mentioned = new Set<string>();
  for (const token of tokens) {
    for (const uid of slugMap.get(token) ?? []) {
      mentioned.add(uid);
    }
  }
  return [...mentioned];
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId } = await params;

  const member = await prisma.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!member || member.leftAt) {
    return NextResponse.json({ error: "Not a member of this room" }, { status: 403 });
  }

  let bodyText: string | undefined;
  let attachmentUrl: string | undefined;
  let attachmentPublicId: string | undefined;
  let attachmentType: string | undefined;
  let attachmentName: string | undefined;

  try {
    const json = await req.json();
    bodyText = json.body?.trim() || undefined;
    attachmentUrl = json.attachmentUrl || undefined;
    attachmentPublicId = json.attachmentPublicId || undefined;
    attachmentType = json.attachmentType || undefined;
    attachmentName = json.attachmentName || undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (attachmentUrl !== undefined && !isValidAttachmentUrl(attachmentUrl)) {
    return NextResponse.json({ error: "Invalid attachment URL" }, { status: 400 });
  }

  if (!bodyText && !attachmentUrl) {
    return NextResponse.json({ error: "Message must have text or an attachment" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      roomId,
      senderId: userId,
      body: bodyText ?? null,
      attachmentUrl: attachmentUrl ?? null,
      attachmentPublicId: attachmentPublicId ?? null,
      attachmentType: attachmentType ?? null,
      attachmentName: attachmentName ?? null,
    },
    select: msgSelect,
  });

  // Mark sender's lastReadAt so they don't see their own message as unread
  await prisma.chatMember.update({
    where: { roomId_userId: { roomId, userId } },
    data: { lastReadAt: message.createdAt },
  });

  // Fetch other active members (with names for mention resolution)
  const others = await prisma.chatMember.findMany({
    where: { roomId, userId: { not: userId }, leftAt: null },
    select: { userId: true, user: { select: { name: true } } },
  });

  const senderName = guard.user.name ?? "A colleague";
  const notifBody = bodyText
    ? bodyText.length > 100 ? bodyText.slice(0, 97) + "…" : bodyText
    : attachmentName ?? "Sent an attachment";

  // Resolve @mentions — deduplicated, unknown names silently ignored
  const mentionedIds = bodyText ? resolveMentions(bodyText, others) : [];
  const mentionedSet = new Set(mentionedIds);

  await Promise.all([
    // Standard new-message notification for every other member
    ...others.map((m) =>
      createNotification({
        userId: m.userId,
        type: "CHAT_MESSAGE",
        title: `New message from ${senderName}`,
        body: notifBody,
        link: `/admin/connect?room=${roomId}`,
      }),
    ),
    // Additional CHAT_MENTION notification for explicitly mentioned members
    ...[...mentionedSet].map((uid) =>
      createNotification({
        userId: uid,
        type: "CHAT_MENTION",
        title: `${senderName} mentioned you`,
        body: notifBody,
        link: `/admin/connect?room=${roomId}`,
      }),
    ),
  ]);

  return NextResponse.json(message, { status: 201 });
}
