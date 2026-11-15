import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { offerLetterEmailSubject, offerLetterHtml, offerLetterText, sendMail } from "@/lib/mail";
import { DEPARTMENTS, SIGNATORY, longDate } from "@/lib/offerLetters/schema";
import { loadOfferLetter } from "@/lib/offerLetters/server";
import { offerLetterFilename, renderOfferLetterPdf } from "@/lib/offerLetters/pdf";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Email the letter (PDF attached) to the recipient email saved on it. */
export async function POST(_req: Request, { params }: Params) {
  const guard = await requirePermission("employees", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const letter = await loadOfferLetter(id);
  if (!letter) return NextResponse.json({ error: "Letter not found" }, { status: 404 });
  const { data } = letter;
  const intern = data.engagementType === "INTERNSHIP";

  const emailData = {
    salutationName: `${data.title} ${data.fullName}`,
    firstName: data.fullName.split(/\s+/)[0] ?? data.fullName,
    designation: data.designation,
    team: DEPARTMENTS[data.department].team,
    joiningDate: longDate(data.joiningDate),
    reportingOfficer: data.reportingOfficer,
    pay: `₹${data.monthlyAmount.toLocaleString("en-IN")}`,
    payLabel: intern ? "Stipend" : "Salary",
    incentive: data.commissionPct > 0 ? `${data.commissionPct}% of net profit on tours you convert, paid the month after the tour is completed` : null,
    refNo: letter.refNo,
    signatoryName: SIGNATORY.name,
    signatoryTitle: SIGNATORY.title,
    signatoryPhone: SIGNATORY.phone,
    signatoryEmail: SIGNATORY.email,
  };

  const pdf = await renderOfferLetterPdf(data, letter.refNo);
  let result;
  try {
    result = await sendMail({
      to: data.recipientEmail,
      subject: offerLetterEmailSubject(emailData),
      text: offerLetterText(emailData),
      html: offerLetterHtml(emailData),
      replyTo: SIGNATORY.email,
      // A personal HR email the candidate is expected to reply to.
      headers: { "Auto-Submitted": "no" },
      attachments: [{ filename: offerLetterFilename(data.fullName), content: pdf, contentType: "application/pdf" }],
    });
  } catch (err) {
    console.error("[offer-letter] send failed", err);
    return NextResponse.json({ error: "The email could not be sent. Please try again." }, { status: 502 });
  }
  if (!result.delivered) {
    return NextResponse.json(
      { error: result.skipped ? "Email is not configured on this server." : "The email was not accepted by the mail server." },
      { status: 502 },
    );
  }

  const sentAt = new Date();
  await prisma.offerLetter.update({ where: { id }, data: { sentAt, sentTo: data.recipientEmail } });
  return NextResponse.json({ ok: true, sentAt: sentAt.toISOString(), sentTo: data.recipientEmail });
}
