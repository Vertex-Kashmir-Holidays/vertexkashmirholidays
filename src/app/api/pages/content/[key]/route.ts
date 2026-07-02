import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { getContentDelegate } from "@/lib/admin/pageResources";

type Params = { params: Promise<{ key: string }> };

export const dynamic = "force-dynamic";

// Upsert a singleton page-content record (home / about / contact).
export async function PATCH(req: NextRequest, { params }: Params) {
  const { key } = await params;
  const delegate = getContentDelegate(key);
  if (!delegate) return NextResponse.json({ error: "Unknown page" }, { status: 404 });

  // key is home | about | contact | blogs — which is also the RBAC module.
  const guard = await requirePermission(key as "home" | "about" | "contact" | "blogs", "edit");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Strip system fields; the per-page form supplies the validated column set.
  const { id: _id, createdAt: _c, updatedAt: _u, ...data } = body as Record<string, unknown>;

  try {
    const saved = await delegate.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json({ error: "Update failed — check field names" }, { status: 422 });
  }
}
