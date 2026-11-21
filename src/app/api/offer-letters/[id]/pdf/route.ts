import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/permissions";
import { loadOfferLetter } from "@/lib/offerLetters/server";
import { offerLetterFilename, renderOfferLetterPdf } from "@/lib/offerLetters/pdf";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Download the letter PDF (?inline=1 opens it in the browser instead). */
export async function GET(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("employees", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const letter = await loadOfferLetter(id);
  if (!letter) return NextResponse.json({ error: "Letter not found" }, { status: 404 });

  const pdf = await renderOfferLetterPdf(letter.data, letter.refNo);
  const disposition = req.nextUrl.searchParams.get("inline") === "1" ? "inline" : "attachment";
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${offerLetterFilename(letter.data.fullName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
