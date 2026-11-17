import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { docFileError, storeDocFile } from "@/lib/docs/upload";
import { B2B_VISIBLE_DOC_CATEGORIES, DOC_CATEGORIES, isDocCategory } from "@/lib/docs/categories";
import { notifyB2bAgentsOfDocument } from "@/lib/b2b/notify";
import { docMetaSchema } from "@/lib/docs/docSchema";

export const dynamic = "force-dynamic";

// Matches the Careers résumé-upload precedent (src/app/api/careers/apply/route.ts):
// one shared byte cap + MIME allowlist, checked here authoritatively (the
// client also checks for UX, but this is the source of truth).
export async function GET() {
  const guard = await requirePermission("docs", "view");
  if (guard instanceof NextResponse) return guard;

  const docs = await prisma.adminDocument.findMany({
    // Agent-only documents are managed from Admin → B2B Agents, not the library.
    where: { agentId: null },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("docs", "create");
  if (guard instanceof NextResponse) return guard;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const meta = docMetaSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
  });
  const category = formData.get("category");

  const fileError = docFileError(file);
  if (fileError || !(file instanceof File)) {
    return NextResponse.json({ error: fileError }, { status: 400 });
  }
  if (!meta.success) {
    return NextResponse.json({ error: meta.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  if (!isDocCategory(category)) {
    return NextResponse.json(
      { error: `Category must be one of: ${DOC_CATEGORIES.join(", ")}` },
      { status: 400 },
    );
  }
  let stored: Awaited<ReturnType<typeof storeDocFile>>;
  try {
    stored = await storeDocFile(file);
  } catch (err) {
    console.error("[admin/docs] upload failed:", err);
    return NextResponse.json({ error: "Could not upload the file. Please try again." }, {
      status: 500,
    });
  }

  const created = await prisma.adminDocument.create({
    data: {
      ...meta.data,
      category,
      ...stored,
      uploadedById: guard.user.id as string,
      uploadedByName: (guard.user.name ?? guard.user.email) as string,
    },
  });
  // A document agents can see → tell every active agent it's there. Sent
  // after the response, so the upload doesn't wait on the mail server;
  // `notifiedAgents` is how many are being emailed (0 for other categories).
  let notifiedAgents = 0;
  if (B2B_VISIBLE_DOC_CATEGORIES.includes(category)) {
    notifiedAgents = await prisma.user.count({ where: { agencyStatus: "ACTIVE" } });
    if (notifiedAgents > 0) {
      after(async () => {
        const result = await notifyB2bAgentsOfDocument(created);
        console.log("[admin/docs] B2B document notice", { doc: created.title, ...result });
      });
    }
  }
  return NextResponse.json({ ...created, notifiedAgents }, { status: 201 });
}
