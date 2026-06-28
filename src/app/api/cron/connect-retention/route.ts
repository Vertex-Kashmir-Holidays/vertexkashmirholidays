import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/storage";

export const dynamic = "force-dynamic";

const RETENTION_DAYS = 90;

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // Collect attachment public IDs before deleting so we can purge from Cloudinary
  const expiredMessages = await prisma.chatMessage.findMany({
    where: {
      createdAt: { lt: cutoff },
      deletedAt: null,
    },
    select: { id: true, attachmentPublicId: true },
  });

  const publicIds = expiredMessages
    .map((m) => m.attachmentPublicId)
    .filter((id): id is string => !!id);

  const [cloudinaryDeleted, dbResult] = await Promise.all([
    deleteFromCloudinary(publicIds),
    prisma.chatMessage.deleteMany({
      where: { createdAt: { lt: cutoff } },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    messagesDeleted: dbResult.count,
    cloudinaryAssetsDeleted: cloudinaryDeleted,
    cutoff: cutoff.toISOString(),
  });
}
