import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { docLinkCreateSchema } from "@/lib/docs/linkSchema";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requirePermission("docs", "view");
  if (guard instanceof NextResponse) return guard;

  const links = await prisma.adminDocLink.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission("docs", "create");
  if (guard instanceof NextResponse) return guard;

  const body = await req.json().catch(() => null);
  const parsed = docLinkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const created = await prisma.adminDocLink.create({
    data: {
      ...parsed.data,
      createdById: guard.user.id as string,
      createdByName: (guard.user.name ?? guard.user.email) as string,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
