import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { adventureSchema } from "@/lib/admin/adventureSchema";
import { invalidateAdventure } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requirePermission("adventures", "view");
  if (guard instanceof NextResponse) return guard;

  const adventures = await prisma.adventure.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ adventures });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("adventures", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adventureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const created = await prisma.adventure.create({ data: parsed.data });
    invalidateAdventure({ slug: created.slug });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002"))
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
