import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { sendB2bAnnouncement } from "@/lib/b2b/notify";
import { resolveB2bAudience } from "@/lib/b2b/audience";
import { B2B_ATTACHMENT_MAX_BYTES, B2B_ATTACHMENT_TYPES } from "@/lib/b2b/communication";

export const dynamic = "force-dynamic";

const schema = z.object({
  // Omitted → every ACTIVE agent. Given → exactly those agents, whatever
  // their status (staff picked them on purpose).
  agentIds: z.array(z.string().min(1)).min(1).max(500).optional(),
  subject: z.string().trim().min(3, "Add a title.").max(150),
  message: z.string().trim().min(10, "Write a message of at least 10 characters.").max(5000),
  // One optional file, sent as base64 (kept small — request bodies are capped).
  attachment: z
    .object({
      name: z.string().trim().min(1).max(150),
      type: z.string().refine((t) => (B2B_ATTACHMENT_TYPES as readonly string[]).includes(t), {
        message: "Attach a PDF, image, Word or Excel file.",
      }),
      data: z.string().min(1),
    })
    .optional(),
  // Tagged B2B request: the email goes to that request's agent only, and
  // opens with the request's details.
  requestId: z.string().min(1).optional(),
});

/** Email all or selected B2B agents a message staff write themselves
 *  (Admin → B2B Communication / B2B Agents → Email agents, or a follow-up from
 *  a B2B request). One email per agent; each send is kept in B2bMessage. */
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
  const { agentIds, subject, attachment, requestId } = parsed.data;
  let { message } = parsed.data;

  let file: { filename: string; content: Buffer; contentType: string } | undefined;
  if (attachment) {
    const content = Buffer.from(attachment.data, "base64");
    if (content.length === 0 || content.length > B2B_ATTACHMENT_MAX_BYTES) {
      return NextResponse.json({ error: "The attachment must be under 3 MB." }, { status: 422 });
    }
    file = { filename: attachment.name, content, contentType: attachment.type };
  }

  const audience = await resolveB2bAudience({ requestId, agentIds }, message);
  if (!audience) return NextResponse.json({ error: "B2B request not found" }, { status: 404 });
  const { recipients } = audience;
  message = audience.message;
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No B2B agents to email." }, { status: 422 });
  }

  const result = await sendB2bAnnouncement(recipients, subject, message, file ? [file] : undefined);

  await prisma.b2bMessage
    .create({
      data: {
        subject,
        message,
        attachmentName: file?.filename ?? null,
        requestId: requestId ?? null,
        recipients: recipients.map((r) => ({
          id: r.id,
          name: r.name,
          agencyName: r.agencyName,
          email: r.email,
        })),
        sent: result.sent,
        failed: result.failed,
        sentById: guard.user.id as string,
        sentByName: (guard.user.name ?? guard.user.email) as string,
      },
    })
    .catch((err) => console.error("[b2b-agents/email] history save failed", err));

  return NextResponse.json({ total: recipients.length, ...result });
}
