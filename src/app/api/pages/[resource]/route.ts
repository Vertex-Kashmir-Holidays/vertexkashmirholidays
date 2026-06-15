import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getResource } from "@/lib/admin/pageResources";

type Params = { params: Promise<{ resource: string }> };

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: Params) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const guard = await requirePermission(def.module, "view");
  if (guard instanceof NextResponse) return guard;

  const orderBy = def.meta.sortable
    ? [{ sortOrder: "asc" }, { createdAt: "asc" }]
    : [{ createdAt: "asc" }];
  const items = await def.model.findMany({ orderBy });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { resource } = await params;
  const def = getResource(resource);
  if (!def) return NextResponse.json({ error: "Unknown resource" }, { status: 404 });

  const guard = await requirePermission(def.module, "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = def.schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const created = await def.model.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}
