import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { proposalDataSchema } from "@/types/proposal";
import { proposalTitleExists } from "@/lib/proposal/list";
import { buildDocumentTitle, duplicateTitleMessage } from "@/lib/itinerary/documentTitle";
import { ASSIGNABLE_ROLES, canAccessProposal } from "@/lib/proposal/access";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("proposals", "view");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const record = await prisma.proposalItinerary.findUnique({
    where: { id },
    include: { owner: { select: { name: true } }, assignedTo: { select: { name: true } } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessProposal(guard.user.role, guard.user.id, record)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: record.id,
    title: record.title,
    status: record.status,
    ownerId: record.ownerId,
    ownerName: record.owner?.name ?? null,
    assignedToId: record.assignedToId,
    assignedToName: record.assignedTo?.name ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    data: record.data,
  });
}

// The title is generated from `data` (see documentTitle.ts), not accepted from the client.
const patchSchema = z.object({
  status: z.enum(["DRAFT", "SENT"]).optional(),
  data: proposalDataSchema.optional(),
  // Hand the proposal to another sales person (null = unassign). Owner,
  // current assignee or an admin may change it.
  assignedToId: z.string().min(1).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("proposals", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.proposalItinerary.findUnique({
    where: { id },
    select: { ownerId: true, assignedToId: true, title: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessProposal(guard.user.role, guard.user.id, existing)) {
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  // Names are unique, drafts and sent alike. A copy saved without changing the
  // customer name/phone/duration regenerates its source's name and is refused.
  let title: string | undefined;
  if (parsed.data.data !== undefined) {
    title = buildDocumentTitle(parsed.data.data);
    if (await proposalTitleExists(title, id)) {
      return NextResponse.json({ error: duplicateTitleMessage(title) }, { status: 409 });
    }
  }

  const { assignedToId } = parsed.data;
  if (assignedToId) {
    const assignee = await prisma.user.findFirst({
      where: { id: assignedToId, deletedAt: null, role: { in: [...ASSIGNABLE_ROLES] } },
      select: { id: true },
    });
    if (!assignee) {
      return NextResponse.json({ error: "Pick an active sales or admin user." }, { status: 422 });
    }
  }

  const updated = await prisma.proposalItinerary.update({
    where: { id },
    data: {
      ...(assignedToId !== undefined ? { assignedToId } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.data !== undefined ? { data: parsed.data.data } : {}),
    },
    select: { id: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("proposals", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.proposalItinerary.findUnique({
    where: { id },
    select: { ownerId: true, assignedToId: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessProposal(guard.user.role, guard.user.id, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.proposalItinerary.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
