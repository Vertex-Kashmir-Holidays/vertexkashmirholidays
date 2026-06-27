import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

// ─── Status computation ───────────────────────────────────────────────────────

type EffectiveStatus = "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";

function effectiveStatus(p: { status: string; lastSeenAt: Date }): EffectiveStatus {
  // Manual overrides persist until the user changes them or goes offline
  if (p.status === "BUSY") return "BUSY";
  if (p.status === "AWAY") return "AWAY";
  const ageMs = Date.now() - p.lastSeenAt.getTime();
  if (ageMs < 60_000) return "ONLINE";
  if (ageMs < 5 * 60_000) return "AWAY";
  return "OFFLINE";
}

// ─── GET — self (no params) or bulk by ids ────────────────────────────────────

export async function GET(req: NextRequest) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const myId = guard.user.id;

  const ids = req.nextUrl.searchParams.get("ids");

  if (!ids) {
    // Return current user's own presence
    const p = await prisma.userPresence.findUnique({ where: { userId: myId } });
    if (!p) return NextResponse.json({ status: "OFFLINE", lastSeenAt: null });
    return NextResponse.json({ status: effectiveStatus(p), lastSeenAt: p.lastSeenAt });
  }

  // Bulk lookup — only return presence for users the caller shares a room with
  const userIds = ids
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50); // cap to prevent abuse

  if (userIds.length === 0) return NextResponse.json({});

  const rows = await prisma.userPresence.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, status: true, lastSeenAt: true },
  });

  const result: Record<string, EffectiveStatus> = {};
  // Seed all requested IDs as OFFLINE; override below for those with rows
  for (const id of userIds) result[id] = "OFFLINE";
  for (const row of rows) result[row.userId] = effectiveStatus(row);

  return NextResponse.json(result);
}

// ─── POST — heartbeat ─────────────────────────────────────────────────────────

export async function POST(_req: NextRequest) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;

  // Preserve manual BUSY status on heartbeat; otherwise set ONLINE
  const existing = await prisma.userPresence.findUnique({
    where: { userId },
    select: { status: true },
  });
  const keepStatus =
    existing?.status === "BUSY" || existing?.status === "AWAY" ? existing.status : "ONLINE";

  await prisma.userPresence.upsert({
    where: { userId },
    update: { status: keepStatus, lastSeenAt: new Date() },
    create: { userId, status: "ONLINE", lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// ─── PATCH — manual status ────────────────────────────────────────────────────

const patchSchema = z.object({
  status: z.enum(["ONLINE", "AWAY", "BUSY"]),
});

export async function PATCH(req: NextRequest) {
  const guard = await requirePermission("connect", "view");
  if (guard instanceof NextResponse) return guard;
  const userId = guard.user.id;

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await prisma.userPresence.upsert({
    where: { userId },
    update: { status: body.status, lastSeenAt: new Date() },
    create: { userId, status: body.status, lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
