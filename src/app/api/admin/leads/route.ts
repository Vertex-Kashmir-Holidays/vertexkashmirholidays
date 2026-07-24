import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { notifyLeadAssigned } from "@/lib/notifications";
import { LeadSource, LeadCategory, LeadActivityType } from "@prisma/client";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  source: z.nativeEnum(LeadSource).default(LeadSource.MANUAL),
  category: z.nativeEnum(LeadCategory).nullable().optional(),
  adults: z.coerce.number().int().positive().default(1),
  children: z.coerce.number().int().min(0).nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  notes: z.string().optional(),
  followUpAt: z.string().nullable().optional(),
  negotiatedAmount: z.coerce.number().positive().nullable().optional(),
  tokenAmount: z.coerce.number().positive().nullable().optional(),
});

// Staff-only: create a fully-populated lead in one step.
// The public POST /api/leads uses a fuzzy source resolver and only accepts
// basic fields — this endpoint accepts the full field set via enum values.
export async function POST(req: NextRequest) {
  const guard = await requirePermission("leads", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const {
    assignedToId,
    startDate,
    endDate,
    email,
    notes,
    followUpAt,
    negotiatedAmount,
    tokenAmount,
    ...rest
  } = parsed.data;
  const performedByName = (guard.user.name ?? guard.user.email) as string;
  const performedById = guard.user.id as string;

  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        ...rest,
        email: email || undefined,
        notes: notes || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        followUpAt: followUpAt ? new Date(followUpAt) : undefined,
        ...(negotiatedAmount !== undefined && { negotiatedAmount }),
        ...(tokenAmount !== undefined && { tokenAmount }),
        ...(assignedToId ? { assignedTo: { connect: { id: assignedToId } } } : {}),
      },
    });

    if (assignedToId) {
      await tx.leadActivity.create({
        data: {
          leadId: created.id,
          type: LeadActivityType.ASSIGNMENT_CHANGE,
          toAssigneeId: assignedToId,
          performedById,
          performedByName,
        },
      });
    }

    if (notes?.trim()) {
      await tx.leadActivity.create({
        data: {
          leadId: created.id,
          type: LeadActivityType.NOTE_ADDED,
          note: notes,
          performedById,
          performedByName,
        },
      });
    }

    if (followUpAt) {
      await tx.leadActivity.create({
        data: {
          leadId: created.id,
          type: LeadActivityType.FOLLOW_UP_SCHEDULED,
          note: `Scheduled for ${new Date(followUpAt).toISOString().slice(0, 16).replace("T", " ")}`,
          performedById,
          performedByName,
        },
      });
    }

    return created;
  });

  // Notify the assignee (in-app + email), best-effort — never blocks creation.
  if (assignedToId) {
    await notifyLeadAssigned(
      assignedToId,
      {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        category: lead.category,
        startDate: lead.startDate,
      },
      performedByName,
    );
  }

  return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
}
