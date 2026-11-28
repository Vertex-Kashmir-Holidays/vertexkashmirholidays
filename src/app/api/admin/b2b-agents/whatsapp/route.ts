import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { resolveB2bAudience } from "@/lib/b2b/audience";
import { b2bWhatsAppText } from "@/lib/b2b/communication";
import { buildWhatsAppHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const schema = z.object({
  agentIds: z.array(z.string().min(1)).min(1).max(500).optional(),
  subject: z.string().trim().min(3, "Add a title.").max(150),
  message: z.string().trim().min(10, "Write a message of at least 10 characters.").max(5000),
  requestId: z.string().min(1).optional(),
  attachmentName: z.string().trim().max(150).optional(),
});

/** Indian 10-digit mobiles get +91; anything with a country code is kept. */
function waNumber(phone: string | null): string | null {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) return `91${digits}`;
  return digits.length >= 11 ? digits : null;
}

/**
 * The B2B Communication message as WhatsApp click-to-chat links — same
 * audience and wording as the email (POST /api/admin/b2b-agents/email), one
 * personalised chat per agent. Staff press Send in WhatsApp; it is logged in
 * the history as a WhatsApp message.
 */
export async function POST(req: NextRequest) {
  const guard = await requirePermission("b2bAgents", "edit");
  if (guard instanceof NextResponse) return guard;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 422 });
  }
  const { agentIds, subject, requestId, attachmentName } = parsed.data;

  const audience = await resolveB2bAudience({ requestId, agentIds }, parsed.data.message);
  if (!audience) return NextResponse.json({ error: "B2B request not found" }, { status: 404 });
  if (audience.recipients.length === 0) {
    return NextResponse.json({ error: "No B2B agents to message." }, { status: 422 });
  }

  const chats = audience.recipients.map((r) => {
    const number = waNumber(r.phone);
    const contactName = r.name?.trim() || r.agencyName?.trim() || "Partner";
    return {
      id: r.id,
      label: r.agencyName ?? r.name ?? r.email,
      href: number
        ? buildWhatsAppHref(number, b2bWhatsAppText({ contactName, subject, message: audience.message }))
        : null,
    };
  });
  const ready = chats.filter((c) => c.href).length;

  await prisma.b2bMessage
    .create({
      data: {
        subject: `[WhatsApp] ${subject}`,
        message: audience.message,
        attachmentName: attachmentName ?? null,
        requestId: requestId ?? null,
        recipients: audience.recipients.map((r) => ({
          id: r.id,
          name: r.name,
          agencyName: r.agencyName,
          email: r.email,
        })),
        sent: ready,
        failed: chats.length - ready,
        sentById: guard.user.id as string,
        sentByName: (guard.user.name ?? guard.user.email) as string,
      },
    })
    .catch((err) => console.error("[b2b-agents/whatsapp] history save failed", err));

  return NextResponse.json({ chats });
}
