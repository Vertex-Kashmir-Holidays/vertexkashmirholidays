import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { Role } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") return null;
  return session;
}

const patchSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Prevent demoting self
  if (session.user?.id === id && existing.role === "ADMIN") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const updated = await prisma.user.update({
    where: { id },
    data: { role: parsed.data.role as Role },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(updated);
}
