import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { Role } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  role: z.enum(["SUPERADMIN", "ADMIN", "SALES", "EDITOR", "CUSTOMER"]),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requirePermission("users", "edit");
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Prevent changing your own role (avoid locking yourself out).
  if (session.user?.id === id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  // Only a SUPERADMIN may grant SUPERADMIN access or modify another superadmin.
  if (
    (parsed.data.role === "SUPERADMIN" || existing.role === "SUPERADMIN") &&
    session.user?.role !== "SUPERADMIN"
  ) {
    return NextResponse.json({ error: "Only a Super Admin can manage Super Admin access" }, { status: 403 });
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role as Role },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(updated);
}
