import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/permissions";
import { isStaff } from "@/lib/rbac";
import { B2B_VISIBLE_DOC_CATEGORIES, docDownloadFilename, isDocCategory } from "@/lib/docs/categories";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Same-origin download proxy for AdminDocument files. Needed because the
 * stored Cloudinary URL is cross-origin and deliberately extension-less (see
 * saveToCloudinary in src/lib/storage.ts) — a direct <a href> to it loses the
 * file extension on save, since browsers don't reliably honor the `download`
 * attribute's filename for cross-origin URLs. Streaming the bytes through our
 * own domain with an explicit Content-Disposition fixes that for every
 * browser.
 *
 * Reachable by staff with docs:view, and by any B2B agent for a doc whose
 * category is B2B-visible (matches what /account already shows them).
 */
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const doc = await prisma.adminDocument.findUnique({
    where: { id },
    select: { title: true, category: true, url: true, mimeType: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const staffAllowed = isStaff(session.user.role) && (await can(session.user.role, "docs", "view"));
  const agentAllowed =
    session.user.agencyStatus !== null &&
    isDocCategory(doc.category) &&
    B2B_VISIBLE_DOC_CATEGORIES.includes(doc.category);
  if (!staffAllowed && !agentAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const upstream = await fetch(doc.url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Could not fetch the file." }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${docDownloadFilename(doc.title, doc.mimeType)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
