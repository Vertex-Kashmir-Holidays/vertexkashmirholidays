import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { sendB2bAgentActivationEmail } from "@/lib/b2b/notify";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Re-issue an ACTIVE agent's login credentials: a fresh temp password, emailed
 * with the same activation email the approval sends. For when that first email
 * never arrived (SMTP hiccup, spam, wrong inbox).
 *
 * The email is sent FIRST and the new password is saved only if it was
 * delivered — so a failed send never locks the agent out of a password they
 * may already have.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bAgents", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const agent = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, agencyName: true, agencyStatus: true, deletedAt: true },
  });
  if (!agent || agent.agencyStatus === null || agent.deletedAt) {
    return NextResponse.json({ error: "B2B agent not found" }, { status: 404 });
  }
  if (agent.agencyStatus !== "ACTIVE") {
    return NextResponse.json(
      { error: "Credentials can only be resent to an active agent" },
      { status: 422 },
    );
  }

  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const { delivered } = await sendB2bAgentActivationEmail(
    agent.email,
    agent.name ?? "",
    agent.agencyName ?? agent.name ?? "",
    tempPassword,
  );
  if (!delivered) {
    return NextResponse.json(
      { error: `Email to ${agent.email} could not be sent. The agent's password was not changed.` },
      { status: 502 },
    );
  }

  await prisma.user.update({
    where: { id },
    data: { passwordHash, mustChangePassword: true },
  });

  return NextResponse.json({ ok: true, email: agent.email });
}
