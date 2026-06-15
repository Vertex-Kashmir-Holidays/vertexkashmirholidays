import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { requirePermission } from "@/lib/permissions";
import { getResource } from "@/lib/admin/pageResources";

type Params = { params: Promise<{ resource: string; id: string }> };

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: Params) {
  const { resource, id } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const guard = await requirePermission(def.module, "edit");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Partial validation for updates (schema is always a ZodObject).
  const partialSchema = (def.schema as unknown as { partial: () => z.ZodType }).partial();
  const parsed = partialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const updated = await def.model.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { resource, id } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const guard = await requirePermission(def.module, "delete");
  if (guard instanceof NextResponse) return guard;

  await def.model.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
