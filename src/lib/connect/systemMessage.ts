import { prisma } from "@/lib/prisma";

export async function createSystemMessage(roomId: string, senderId: string, body: string) {
  return prisma.chatMessage.create({
    data: { roomId, senderId, body, isSystem: true },
    select: {
      id: true,
      roomId: true,
      senderId: true,
      body: true,
      isSystem: true,
      createdAt: true,
      updatedAt: true,
      sender: { select: { id: true, name: true, image: true } },
      attachmentUrl: true,
      attachmentPublicId: true,
      attachmentType: true,
      attachmentName: true,
      editedAt: true,
      deletedAt: true,
      reactions: true,
    },
  });
}
