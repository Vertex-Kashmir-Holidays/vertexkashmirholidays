import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { itineraryDataSchema } from "@/types/itinerary";
import type { Role } from "@/lib/rbac";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function isAdmin(role?: Role | string | null): boolean {
  return role === "SUPERADMIN" || role === "ADMIN";
}

// List itineraries. Staff see their own; ADMIN/SUPERADMIN see all.
export async function GET() {
  const guard = await requirePermission("itinerary", "view");
  if (guard instanceof NextResponse) return guard;

  const { id: userId, role } = guard.user;
  const where: Prisma.ItineraryWhereInput = isAdmin(role) ? {} : { ownerId: userId };

  const items = await prisma.itinerary.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { name: true } },
    },
  });

  return NextResponse.json({
    itineraries: items.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      ownerId: i.ownerId,
      ownerName: i.owner?.name ?? null,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    })),
  });
}

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  status: z.enum(["DRAFT", "SENT", "CONFIRMED"]).optional(),
  data: itineraryDataSchema,
});

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

  const created = await prisma.itinerary.create({
    data: {
      title: parsed.data.title,
      status: parsed.data.status ?? "DRAFT",
      data: parsed.data.data,
      ownerId: guard.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
