import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { offerLetterInputSchema, withFixedTerms } from "@/lib/offerLetters/schema";
import { loadOfferLetter, refNoForDate, toJson } from "@/lib/offerLetters/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const SENT_LOCKED = "This letter has already been emailed. Create a new letter for any correction.";

/** Update a draft letter. Emailed letters are final. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("employees", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const letter = await loadOfferLetter(id);
  if (!letter) return NextResponse.json({ error: "Letter not found" }, { status: 404 });
  if (letter.sentAt) return NextResponse.json({ error: SENT_LOCKED }, { status: 422 });

  const parsed = offerLetterInputSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid letter" }, { status: 422 });
  }
  const data = withFixedTerms(parsed.data);
  const updated = await prisma.offerLetter.update({
    where: { id },
    data: { data: toJson(data), refNo: refNoForDate(letter.refNo, data.letterDate) },
    select: { id: true, refNo: true },
  });
  return NextResponse.json(updated);
}

/** Delete a draft letter. Emailed letters are kept as a record. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("employees", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const letter = await prisma.offerLetter.findUnique({ where: { id }, select: { sentAt: true } });
  if (!letter) return NextResponse.json({ error: "Letter not found" }, { status: 404 });
  if (letter.sentAt) {
    return NextResponse.json({ error: "Emailed letters are kept as a record and can't be deleted." }, { status: 422 });
  }
  await prisma.offerLetter.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
