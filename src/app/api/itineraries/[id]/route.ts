import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { itineraryDataSchema } from "@/types/itinerary";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function isAdmin(role?: Role | string | null): boolean {
  return role === "SUPERADMIN" || role === "ADMIN";
}

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const record = await prisma.itinerary.findUnique({
    where: { id },
    include: { owner: { select: { name: true } } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (record.ownerId !== guard.user.id && !isAdmin(guard.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: record.id,
    title: record.title,
    status: record.status,
    ownerId: record.ownerId,
    ownerName: record.owner?.name ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    data: record.data,
  });
}

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(["DRAFT", "SENT", "CONFIRMED"]).optional(),
  data: itineraryDataSchema.optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.itinerary.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.ownerId !== guard.user.id && !isAdmin(guard.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
  }

  const updated = await prisma.itinerary.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.data !== undefined ? { data: parsed.data.data } : {}),
    },
    select: { id: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.itinerary.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.ownerId !== guard.user.id && !isAdmin(guard.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.itinerary.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
