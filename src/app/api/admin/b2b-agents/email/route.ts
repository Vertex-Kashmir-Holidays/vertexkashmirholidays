import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { activeB2bRecipients, sendB2bAnnouncement } from "@/lib/b2b/notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  // Omitted → every ACTIVE agent. Given → exactly those agents, whatever
  // their status (staff picked them on purpose).
  agentIds: z.array(z.string().min(1)).min(1).max(500).optional(),
  subject: z.string().trim().min(3, "Add a subject.").max(150),
  message: z.string().trim().min(10, "Write a message of at least 10 characters.").max(5000),
});

/** Email all or selected B2B agents a message staff write themselves
 *  (Admin → B2B Agents → Email agents). One email per agent. */
export async function POST(req: NextRequest) {
  const guard = await requirePermission("b2bAgents", "edit");
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 422 },
    );
  }
  const { agentIds, subject, message } = parsed.data;

  const recipients = agentIds
    ? await prisma.user.findMany({
        where: { id: { in: agentIds }, agencyStatus: { not: null } },
        select: { email: true, name: true, agencyName: true },
      })
    : await activeB2bRecipients();
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No B2B agents to email." }, { status: 422 });
  }

  const result = await sendB2bAnnouncement(recipients, subject, message);
  console.log("[b2b-agents/email] announcement sent", {
    by: guard.user.email,
    subject,
    recipients: recipients.length,
    ...result,
  });
  return NextResponse.json({ total: recipients.length, ...result });
}
