import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; messageId: string }> };

const editSchema = z.object({
  body: z.string().min(1).max(4000).trim(),
});

const msgSelect = {
  id: true, roomId: true, senderId: true, body: true,
  attachmentUrl: true, attachmentPublicId: true, attachmentType: true, attachmentName: true,
  editedAt: true, deletedAt: true, createdAt: true,
  sender: { select: { id: true, name: true, image: true } },
} as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "edit");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId, messageId } = await params;

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.roomId !== roomId || message.deletedAt) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (message.senderId !== userId) {
    return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
  }
  if (!message.body) {
    return NextResponse.json({ error: "Cannot edit attachment-only messages" }, { status: 400 });
  }

  let body: z.infer<typeof editSchema>;
  try {
    body = editSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updated = await prisma.chatMessage.update({
    where: { id: messageId },
    data: { body: body.body, editedAt: new Date() },
    select: msgSelect,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "edit");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId, messageId } = await params;

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.roomId !== roomId || message.deletedAt) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Own message OR group admin can delete
  if (message.senderId !== userId) {
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json({ error: "Cannot delete this message" }, { status: 403 });
    }
  }

  const updated = await prisma.chatMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
    select: msgSelect,
  });

  return NextResponse.json(updated);
}
