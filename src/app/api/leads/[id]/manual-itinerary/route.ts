import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { isAdminRole } from "@/lib/itinerary/access";
import { saveUpload } from "@/lib/storage";
import { manualItineraryFileError } from "@/lib/leads/manualItinerary";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const artifactSchema = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Enter a valid https:// link.");

/**
 * Who may change a lead's manual itinerary: on a B2B request, anyone with
 * B2B Requests → Edit; on a normal lead, its assignee or an admin (with
 * Leads → Edit) — the same people who manage the lead itself.
 */
async function loadForEdit(id: string) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.user || !role) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, b2bAgentId: true, assignedToId: true },
  });
  if (!lead) return { error: NextResponse.json({ error: "Lead not found" }, { status: 404 }) };
  const allowed = lead.b2bAgentId
    ? await can(role, "b2bRequests", "edit")
    : (await can(role, "leads", "edit")) && (isAdminRole(role) || lead.assignedToId === session.user.id);
  if (!allowed) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { lead };
}

const selectOut = {
  manualItineraryUrl: true,
  manualItineraryName: true,
  manualItineraryAt: true,
  itineraryArtifactUrl: true,
} as const;

function toInfo(r: {
  manualItineraryUrl: string | null;
  manualItineraryName: string | null;
  manualItineraryAt: Date | null;
  itineraryArtifactUrl: string | null;
}) {
  return {
    url: r.manualItineraryUrl,
    name: r.manualItineraryName,
    uploadedAt: r.manualItineraryAt?.toISOString() ?? null,
    artifactUrl: r.itineraryArtifactUrl,
  };
}

/** Multipart: `file` (PDF, replaces any earlier one) and/or `artifactUrl` ("" clears it). */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loaded = await loadForEdit(id);
  if ("error" in loaded) return loaded.error;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  const rawArtifact = form.get("artifactUrl");
  const hasFile = file instanceof File && file.size > 0;
  if (!hasFile && typeof rawArtifact !== "string") {
    return NextResponse.json({ error: "Nothing to save." }, { status: 422 });
  }

  const data: Record<string, unknown> = {};
  if (typeof rawArtifact === "string") {
    const parsed = artifactSchema.safeParse(rawArtifact);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    data.itineraryArtifactUrl = parsed.data || null;
  }
  if (hasFile) {
    const err = manualItineraryFileError(file);
    if (err) return NextResponse.json({ error: err }, { status: 422 });
    // "raw" so Cloudinary serves the PDF as-is (see storeDocFile).
    const { url } = await saveUpload(Buffer.from(await file.arrayBuffer()), {
      folder: "manual-itineraries",
      ext: "pdf",
      isImage: false,
      resourceType: "raw",
    });
    data.manualItineraryUrl = url;
    data.manualItineraryName = file.name.slice(0, 200) || "Itinerary.pdf";
    data.manualItineraryAt = new Date();
  }

  const updated = await prisma.lead.update({ where: { id }, data, select: selectOut });
  return NextResponse.json({ ok: true, manualItinerary: toInfo(updated) });
}

/** Remove the uploaded PDF (the artifact link stays). */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loaded = await loadForEdit(id);
  if ("error" in loaded) return loaded.error;
  const updated = await prisma.lead.update({
    where: { id },
    data: { manualItineraryUrl: null, manualItineraryName: null, manualItineraryAt: null },
    select: selectOut,
  });
  return NextResponse.json({ ok: true, manualItinerary: toInfo(updated) });
}
