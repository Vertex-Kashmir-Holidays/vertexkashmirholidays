import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { isStaff } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, parseWithSchema } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

// This device turns push notifications on (POST) or off (DELETE). Staff and
// B2B agents only — they're the ones with events to push (see src/lib/push.ts).
const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({ p256dh: z.string().min(1).max(500), auth: z.string().min(1).max(500) }),
});
const unsubscribeSchema = z.object({ endpoint: z.string().url().max(2000) });

async function pushUser() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return isStaff(user.role) || user.agencyStatus != null ? user.id : null;
}

export async function POST(req: NextRequest) {
  const userId = await pushUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(subscribeSchema, body.data);
  if (!parsed.ok) return parsed.response;
  const { endpoint, keys } = parsed.data;
  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;
  // A device belongs to whoever is signed in on it now (shared phone, re-login).
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth, userAgent },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await pushUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(unsubscribeSchema, body.data);
  if (!parsed.ok) return parsed.response;
  await prisma.pushSubscription.deleteMany({ where: { endpoint: parsed.data.endpoint, userId } });
  return NextResponse.json({ ok: true });
}
