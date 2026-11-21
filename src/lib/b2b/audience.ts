// Who a B2B Communication message goes to — shared by the email and WhatsApp
// routes so both channels pick the same agents and open the same way.
import { prisma } from "@/lib/prisma";
import { b2bRequestSummary } from "@/lib/b2b/communication";

export interface B2bAudienceMember {
  id: string;
  email: string;
  name: string | null;
  agencyName: string | null;
  phone: string | null;
}

const recipientSelect = { id: true, email: true, name: true, agencyName: true, phone: true } as const;

/**
 * Tagged request → that request's agent, with the request's details opening
 * the message. Agent ids → exactly those agents (any status — picked on
 * purpose). Neither → every ACTIVE agent. Null when the request isn't found.
 */
export async function resolveB2bAudience(
  input: { requestId?: string; agentIds?: string[] },
  message: string,
): Promise<{ recipients: B2bAudienceMember[]; message: string } | null> {
  if (input.requestId) {
    const lead = await prisma.lead.findUnique({
      where: { id: input.requestId },
      select: {
        name: true,
        days: true,
        adults: true,
        children: true,
        startDate: true,
        createdAt: true,
        b2bAgent: { select: recipientSelect },
      },
    });
    if (!lead?.b2bAgent) return null;
    return { recipients: [lead.b2bAgent], message: `${b2bRequestSummary(lead)}\n\n${message}` };
  }
  const recipients = await prisma.user.findMany({
    where: input.agentIds ? { id: { in: input.agentIds }, agencyStatus: { not: null } } : { agencyStatus: "ACTIVE" },
    select: recipientSelect,
    orderBy: { createdAt: "asc" },
  });
  return { recipients, message };
}
