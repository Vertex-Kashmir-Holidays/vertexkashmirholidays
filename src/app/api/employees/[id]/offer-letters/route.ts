import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { STAFF_ROLES } from "@/lib/rbac";
import { offerLetterInputSchema, withFixedTerms } from "@/lib/offerLetters/schema";
import { createWithRefNo, toJson } from "@/lib/offerLetters/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Create an offer letter (a draft until it is emailed) for an employee. */
export async function POST(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("employees", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const employee = await prisma.user.findFirst({
    where: { id, deletedAt: null, role: { in: STAFF_ROLES } },
    select: { id: true },
  });
  if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

  const parsed = offerLetterInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid letter" }, { status: 422 });
  }
  const data = withFixedTerms(parsed.data);

  const letter = await createWithRefNo(data.letterDate, (refNo) =>
    prisma.offerLetter.create({
      data: { refNo, employeeId: id, data: toJson(data), createdById: guard.user.id as string },
      select: { id: true, refNo: true },
    }),
  );
  return NextResponse.json(letter, { status: 201 });
}
