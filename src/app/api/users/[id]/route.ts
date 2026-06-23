import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { Role } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  role: z.enum(["SUPERADMIN", "ADMIN", "SALES", "EDITOR", "CUSTOMER"]).optional(),
  // Optional sales incentive rate (percent of booking profit). Stored on the user
  // for future monthly commission/payout reports. null clears it.
  bookingConversionPct: z.coerce.number().min(0).max(100).nullable().optional(),
  // Admin-set password reset (e.g. the employee forgot theirs). When provided,
  // it is re-hashed and the user is forced to change it on next login.
  password: z.string().min(8, "Password must be at least 8 characters").max(100).optional(),
});

/** Edit a user's profile fields and/or role. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requirePermission("users", "edit");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  const existing = await prisma.user.findUnique({ where: { id } });
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
  const data = parsed.data;

  // Prevent changing your own role (avoid locking yourself out).
  if (data.role && data.role !== existing.role && session.user?.id === id) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  // Only a SUPERADMIN may grant SUPERADMIN access or modify another superadmin.
  const touchesSuperadmin = data.role === "SUPERADMIN" || existing.role === "SUPERADMIN";
  if (touchesSuperadmin && session.user?.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Only a Super Admin can manage Super Admin access" },
      { status: 403 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.role !== undefined ? { role: data.role as Role } : {}),
        ...(data.bookingConversionPct !== undefined ? { bookingConversionPct: data.bookingConversionPct } : {}),
        ...(data.password
          ? { passwordHash: await bcrypt.hash(data.password, 12), mustChangePassword: true }
          : {}),
      },
      select: { id: true, name: true, email: true, phone: true, role: true, bookingConversionPct: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("P2002")) {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

/**
 * Delete a user. Soft delete by default (sets `deletedAt`, hides the user and
 * blocks their login). Pass `?permanent=1` to remove the row irreversibly.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requirePermission("users", "delete");
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  if (session.user?.id === id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only a SUPERADMIN may delete another superadmin.
  if (existing.role === "SUPERADMIN" && session.user?.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Only a Super Admin can delete a Super Admin" },
      { status: 403 },
    );
  }

  const permanent = new URL(req.url).searchParams.get("permanent") === "1";

  if (permanent) {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true, mode: "permanent" });
  }

  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true, mode: "soft" });
}
