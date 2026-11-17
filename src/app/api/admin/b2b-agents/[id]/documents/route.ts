import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { docMetaSchema } from "@/lib/docs/docSchema";
import { docFileError, storeDocFile } from "@/lib/docs/upload";
import { notifyB2bAgentOfDocument } from "@/lib/b2b/notify";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const SELECT = {
  id: true,
  title: true,
  description: true,
  mimeType: true,
  sizeBytes: true,
  uploadedByName: true,
  createdAt: true,
} as const;

async function loadAgent(id: string) {
  return prisma.user.findFirst({
    where: { id, agencyStatus: { not: null }, deletedAt: null },
    select: { id: true, email: true, name: true, agencyName: true, agencyStatus: true },
  });
}

/** Documents shared with this agent only. */
export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bAgents", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  if (!(await loadAgent(id))) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const docs = await prisma.adminDocument.findMany({
    where: { agentId: id },
    orderBy: { createdAt: "desc" },
    select: SELECT,
  });
  return NextResponse.json(docs);
}

/**
 * Share a document (proposal, quotation, voucher…) with this agent only. It
 * appears in their portal's Documents panel. `sendEmail=true` also emails
 * them about it — staff choose, same as other agent communications.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("b2bAgents", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const agent = await loadAgent(id);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = formData.get("file");
  const fileError = docFileError(file);
  if (fileError || !(file instanceof File)) return NextResponse.json({ error: fileError }, { status: 400 });
  const meta = docMetaSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!meta.success) {
    return NextResponse.json({ error: meta.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const sendEmail = formData.get("sendEmail") === "true";

  let stored: Awaited<ReturnType<typeof storeDocFile>>;
  try {
    stored = await storeDocFile(file);
  } catch (err) {
    console.error("[b2b-agents/documents] upload failed:", err);
    return NextResponse.json({ error: "Could not upload the file. Please try again." }, { status: 500 });
  }

  const created = await prisma.adminDocument.create({
    data: {
      ...meta.data,
      // B2B, so it sits with the partner material; agentId keeps it private to them.
      category: "B2B",
      ...stored,
      agentId: agent.id,
      uploadedById: guard.user.id as string,
      uploadedByName: (guard.user.name ?? guard.user.email) as string,
    },
    select: SELECT,
  });

  // Only an ACTIVE agent can sign in to see it, so only they are emailed.
  const emailed =
    sendEmail && agent.agencyStatus === "ACTIVE"
      ? await notifyB2bAgentOfDocument(agent, { title: created.title, description: created.description })
      : false;

  return NextResponse.json({ ...created, emailed, requestedEmail: sendEmail }, { status: 201 });
}
