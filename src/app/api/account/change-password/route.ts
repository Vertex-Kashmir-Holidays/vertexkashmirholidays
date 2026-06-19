import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Forced first-login password change for accounts created with a system-issued
// temp password. The valid session is the proof of identity here (the customer
// just authenticated with the temp password), so no current-password re-entry is
// required — but the server still clears the flag authoritatively.
const schema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(req: Request) {
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Block reusing the temp password as the new one.
  const sameAsCurrent = await bcrypt.compare(parsed.data.newPassword, user.passwordHash);
  if (sameAsCurrent) {
    return NextResponse.json(
      { error: "Choose a password different from your temporary one." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
      mustChangePassword: false,
    },
  });

  return NextResponse.json({ ok: true });
}
