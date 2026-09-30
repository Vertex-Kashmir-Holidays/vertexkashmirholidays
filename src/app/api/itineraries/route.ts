import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { can, requirePermission } from "@/lib/permissions";
import { itineraryDataSchema } from "@/types/itinerary";
import { listItinerarySummaries, itineraryTitleExists } from "@/lib/itinerary/list";
import { resolveItineraryAccess } from "@/lib/itinerary/access";
import {
  buildDocumentTitle,
  copyTitleCandidates,
  duplicateTitleMessage,
  firstFreeTitle,
} from "@/lib/itinerary/documentTitle";
import { parsePageParams } from "@/lib/pagination";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function isAdmin(role?: Role | string | null): boolean {
  return role === "SUPERADMIN" || role === "ADMIN";
}

// List itineraries (paginated). Staff see their own; ADMIN/SUPERADMIN see all.
export async function GET(req: NextRequest) {
  const guard = await requirePermission("itinerary", "view");
  if (guard instanceof NextResponse) return guard;

  const { id: userId, role } = guard.user;
  const { searchParams } = new URL(req.url);
  const { items, total } = await listItinerarySummaries({
    ownerId: isAdmin(role) ? undefined : userId,
    search: searchParams.get("search")?.trim() ?? "",
    status: searchParams.get("status") ?? undefined,
    ...parsePageParams(searchParams),
  });

  return NextResponse.json({ itineraries: items, total });
}

// Standalone itineraries are titled from the document itself (see
// documentTitle.ts), so the title is not accepted from the client. `copyOf`
// (the list's Duplicate action) clones that itinerary as a standalone DRAFT
// titled "<source title> - copy".
const createSchema = z.union([
  z.object({ copyOf: z.string().min(1) }),
  z.object({
    status: z.enum(["DRAFT", "SENT", "CONFIRMED"]).optional(),
    data: itineraryDataSchema,
  }),
]);

export async function POST(req: NextRequest) {
  const guard = await requirePermission("itinerary", "create");
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

  if ("copyOf" in parsed.data) {
    // A copy must be edited and saved, or it's deleted — so copying needs all three.
    const role = guard.user.role as Role;
    if (!(await can(role, "itinerary", "edit")) || !(await can(role, "itinerary", "delete"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const source = await prisma.itinerary.findUnique({
      where: { id: parsed.data.copyOf },
      select: {
        title: true,
        data: true,
        ownerId: true,
        leadId: true,
        bookingId: true,
        locked: true,
        lead: { select: { assignedToId: true, locked: true, b2bAgentId: true } },
        booking: { select: { servicesLocked: true } },
      },
    });
    const canView =
      source &&
      source.lead?.b2bAgentId == null &&
      resolveItineraryAccess(source, { id: guard.user.id, role: guard.user.role }).canView;
    if (!source || !canView) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const copy = await prisma.itinerary.create({
      data: {
        title: await firstFreeTitle(copyTitleCandidates(source.title), (t) => itineraryTitleExists(t)),
        status: "DRAFT",
        data: source.data ?? {},
        ownerId: guard.user.id,
      },
      select: { id: true },
    });
    return NextResponse.json({ id: copy.id }, { status: 201 });
  }

  const title = buildDocumentTitle(parsed.data.data);
  if (await itineraryTitleExists(title)) {
    return NextResponse.json({ error: duplicateTitleMessage(title) }, { status: 409 });
  }

  const created = await prisma.itinerary.create({
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
