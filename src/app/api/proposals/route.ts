import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { proposalDataSchema } from "@/types/proposal";
import { listProposalSummaries, proposalTitleExists } from "@/lib/proposal/list";
import {
  PROPOSAL_TITLE_PREFIX,
  buildDocumentTitle,
  duplicateTitleMessage,
} from "@/lib/itinerary/documentTitle";
import { parsePageParams } from "@/lib/pagination";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function isAdmin(role?: Role | string | null): boolean {
  return role === "SUPERADMIN" || role === "ADMIN";
}

// List proposals (paginated). Staff see their own; ADMIN/SUPERADMIN see all.
export async function GET(req: NextRequest) {
  const guard = await requirePermission("proposals", "view");
  if (guard instanceof NextResponse) return guard;

  const { id: userId, role } = guard.user;
  const { searchParams } = new URL(req.url);
  const { items, total } = await listProposalSummaries({
    ownerId: isAdmin(role) ? undefined : userId,
    search: searchParams.get("search")?.trim() ?? "",
    status: searchParams.get("status") ?? undefined,
    ...parsePageParams(searchParams),
  });

  return NextResponse.json({ proposals: items, total });
}

// The title is generated from the document itself (see documentTitle.ts), so
// it's not accepted from the client.
const createSchema = z.object({
  status: z.enum(["DRAFT", "SENT"]).optional(),
  data: proposalDataSchema,
  // Sent by the list's Duplicate action — a copy may share its source's name.
  allowDuplicate: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const guard = await requirePermission("proposals", "create");
  if (guard instanceof NextResponse) return guard;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 422 },
    );
  }

  const title = buildDocumentTitle(PROPOSAL_TITLE_PREFIX, parsed.data.data);
  if (!parsed.data.allowDuplicate && (await proposalTitleExists(title))) {
    return NextResponse.json({ error: duplicateTitleMessage(title) }, { status: 409 });
  }

  const created = await prisma.proposalItinerary.create({
    data: {
      title,
      status: parsed.data.status ?? "DRAFT",
      data: parsed.data.data,
      ownerId: guard.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
