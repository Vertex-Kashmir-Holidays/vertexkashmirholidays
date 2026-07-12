import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("connect", "create");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;
  const { id: roomId } = await params;

  // Single updateMany scoped to leftAt: null does the membership check and the
  // write in one round trip instead of a separate findUnique-then-update pair
  // — this fires on nearly every keystroke while a chat is open, matching the
  // pattern the sibling `read` route already uses.
  const result = await prisma.chatMember.updateMany({
    where: { roomId, userId, leftAt: null },
    data: { typingAt: new Date() },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
