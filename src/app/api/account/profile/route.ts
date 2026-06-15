import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const updateSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
  })
  .refine((d) => !d.newPassword || !!d.currentPassword, {
    message: "Current password is required to set a new one",
    path: ["currentPassword"],
  });

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { name, currentPassword, newPassword } = parsed.data;
  const data: { name?: string; passwordHash?: string } = {};

  if (name !== undefined) data.name = name;

  if (newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword!, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ user: updated });
}
