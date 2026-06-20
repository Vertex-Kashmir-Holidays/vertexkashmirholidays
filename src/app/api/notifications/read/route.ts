import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  // Specific notification ids to mark read; omit/empty to mark all as read.
  ids: z.array(z.string()).optional(),
});

/** Mark the current user's notifications as read (all, or a given subset). */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let ids: string[] | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    ids = schema.parse(body).ids;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(ids && ids.length ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
