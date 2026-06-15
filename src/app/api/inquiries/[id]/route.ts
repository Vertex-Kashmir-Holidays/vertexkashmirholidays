import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { InquiryStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "CONVERTED", "CLOSED"]),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("inquiries", "edit");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.inquiry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const updated = await prisma.inquiry.update({
    where: { id },
    data: { status: parsed.data.status as InquiryStatus },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("inquiries", "delete");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const existing = await prisma.inquiry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.inquiry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
