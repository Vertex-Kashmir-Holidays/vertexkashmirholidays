import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { itineraryDataSchema } from "@/types/itinerary";
import { resolveItineraryAccess } from "@/lib/itinerary/access";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Itinerary + the minimal lead fields needed to resolve access.
const ACCESS_SELECT = {
  ownerId: true,
  leadId: true,
  locked: true,
  title: true,
  data: true,
  lead: { select: { assignedToId: true, status: true } },
} as const;

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const record = await prisma.itinerary.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true, email: true } },
      lead: { select: { id: true, assignedToId: true, status: true } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = resolveItineraryAccess(record, { id: guard.user.id, role: guard.user.role });
  if (!access.canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    id: record.id,
    title: record.title,
    status: record.status,
    ownerId: record.ownerId,
    ownerName: record.owner?.name ?? null,
    leadId: record.leadId,
    locked: access.locked,
    canEdit: access.canEdit,
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
  const existing = await prisma.itinerary.findUnique({ where: { id }, select: ACCESS_SELECT });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = resolveItineraryAccess(existing, { id: guard.user.id, role: guard.user.role });
  if (!access.canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!access.canEdit) {
    return NextResponse.json(
      {
        error: access.locked
          ? "This itinerary is locked because the lead is converted and can no longer be edited."
          : "Forbidden",
      },
      { status: 403 },
    );
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

  const editedByName = (guard.user.name ?? guard.user.email) as string;

  const ops: Prisma.PrismaPromise<unknown>[] = [
    prisma.itinerary.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
        ...(parsed.data.data !== undefined ? { data: parsed.data.data } : {}),
        lastEditedById: guard.user.id,
      },
      select: { id: true, updatedAt: true },
    }),
  ];

  // Snapshot a history row for lead-linked itineraries whenever content changes.
  if (existing.leadId && parsed.data.data !== undefined) {
    ops.push(
      prisma.itineraryHistory.create({
        data: {
          itineraryId: id,
          title: parsed.data.title ?? existing.title,
          data: parsed.data.data,
          editedById: guard.user.id,
          editedByName,
        },
      }),
    );
  }

  const [updated] = await prisma.$transaction(ops);
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("itinerary", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.itinerary.findUnique({ where: { id }, select: ACCESS_SELECT });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const access = resolveItineraryAccess(existing, { id: guard.user.id, role: guard.user.role });
  if (!access.canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (access.locked) {
    return NextResponse.json(
      { error: "A locked itinerary for a converted lead cannot be deleted." },
      { status: 422 },
    );
  }

  await prisma.itinerary.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
