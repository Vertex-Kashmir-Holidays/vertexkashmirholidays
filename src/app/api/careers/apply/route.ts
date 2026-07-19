import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { nameField, phoneField } from "@/lib/leads/schema";
import { CAREERS_TOKEN_TTL_MS } from "@/lib/auth/otp";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { checkBotSignals, HONEYPOT_FIELD, TIMETRAP_FIELD } from "@/lib/security/formGuard";
import { saveUpload, saveJson } from "@/lib/storage";
import { sendMail, careersApplicationHtml, careersApplicationText } from "@/lib/mail";
import { getSiteSettings } from "@/lib/siteSettings";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { env } from "@/lib/env";
import { applicationsFolder, type CareersApplicationRecord } from "@/lib/careers/applications";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const MAX_RESUME_BYTES = 1 * 1024 * 1024; // 1 MB, matches JobApplyForm's client-side check
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RESUME_EXT_BY_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

function stripHeader(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

const fieldsSchema = z.object({
  jobId: z.string().min(1),
  fullName: nameField,
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  phone: phoneField,
  experience: z.string().trim().min(1, "Please enter your total experience").max(120),
  currentCompany: z.string().trim().max(160).optional(),
  noticePeriod: z.string().trim().max(120).optional(),
  coverLetter: z.string().trim().max(4000).optional(),
  agree: z.boolean().refine((v) => v === true, {
    message: "Please accept the Privacy Policy.",
  }),
  verificationToken: z.string().min(1),
});

function str(v: FormDataEntryValue | null): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

// Final step of the Careers apply flow: candidate details + resume, gated
// behind the email-verification token issued by verify-otp. No candidate
// record is ever written to the database — the resume (uploaded to
// Cloudinary, tagged with candidate context for the future Resume Inbox) and
// this HR notification email together ARE the record, per the module's
// zero-candidate-PII-in-DB design.
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipLimit = await rateLimit(`careers-apply:${ip}`, 10, "10 m");
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const bot = checkBotSignals({
      [HONEYPOT_FIELD]: formData.get(HONEYPOT_FIELD),
      [TIMETRAP_FIELD]: formData.get(TIMETRAP_FIELD),
    });
    if (!bot.ok) {
      console.warn(`[careers/apply] blocked bot signal (${bot.reason}) ip=${ip}`);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 400 },
      );
    }

    const parsed = fieldsSchema.safeParse({
      jobId: str(formData.get("jobId")),
      fullName: str(formData.get("fullName")),
      email: str(formData.get("email")),
      phone: str(formData.get("phone")),
      experience: str(formData.get("experience")),
      currentCompany: str(formData.get("currentCompany")),
      noticePeriod: str(formData.get("noticePeriod")),
      coverLetter: str(formData.get("coverLetter")),
      agree: formData.get("agree") === "true",
      verificationToken: str(formData.get("verificationToken")),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const resumeFile = formData.get("resume");
    if (!(resumeFile instanceof File) || resumeFile.size === 0) {
      return NextResponse.json({ error: "Please attach your resume." }, { status: 400 });
    }
    if (!ALLOWED_RESUME_TYPES.has(resumeFile.type)) {
      return NextResponse.json(
        { error: "Resume must be a PDF, DOC, or DOCX file." },
        { status: 400 },
      );
    }
    if (resumeFile.size > MAX_RESUME_BYTES) {
      return NextResponse.json(
        { error: "Resume is too large — maximum size is 1 MB." },
        { status: 400 },
      );
    }

    const job = await prisma.job.findUnique({ where: { id: data.jobId } });
    if (!job || !job.published) {
      return NextResponse.json(
        { error: "This job is no longer accepting applications." },
        { status: 400 },
      );
    }

    // Proof of email verification: the OTP row must be CAREERS-purposed,
    // verified, and the token must match the hash issued at verify-otp time —
    // same shape as the forgot-password reset-password step.
    const otpRow = await prisma.emailOtp.findUnique({ where: { email: data.email } });
    if (!otpRow || otpRow.purpose !== "CAREERS" || !otpRow.verifiedAt || !otpRow.resetTokenHash) {
      return NextResponse.json(
        { error: "Please verify your email again before submitting." },
        { status: 400 },
      );
    }
    if (Date.now() - otpRow.verifiedAt.getTime() > CAREERS_TOKEN_TTL_MS) {
      await prisma.emailOtp.delete({ where: { email: data.email } });
      return NextResponse.json(
        { error: "Your email verification has expired. Please verify again." },
        { status: 400 },
      );
    }
    const tokenValid = await bcrypt.compare(data.verificationToken, otpRow.resetTokenHash);
    if (!tokenValid) {
      return NextResponse.json(
        { error: "Please verify your email again before submitting." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    const ext = RESUME_EXT_BY_TYPE[resumeFile.type];

    let resumeUrl: string;
    let resumePublicId: string | null;
    try {
      ({ url: resumeUrl, publicId: resumePublicId } = await saveUpload(buffer, {
        folder: "careers/resumes",
        ext,
        isImage: false,
      }));
    } catch (err) {
      console.error("[careers/apply] resume upload failed:", err);
      return NextResponse.json(
        { error: "Could not upload your resume. Please try again." },
        { status: 500 },
      );
    }

    // Consume the verification — one application per verified session.
    await prisma.emailOtp.delete({ where: { email: data.email } });

    const submittedAtIso = new Date().toISOString();
    const submittedAt = new Date(submittedAtIso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

    const record: CareersApplicationRecord = {
      jobId: job.id,
      jobTitle: job.title,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      experience: data.experience,
      currentCompany: data.currentCompany,
      noticePeriod: data.noticePeriod,
      coverLetter: data.coverLetter,
      resumeUrl,
      resumePublicId,
      submittedAt: submittedAtIso,
    };
    try {
      await saveJson(record, {
        folder: applicationsFolder(job.id),
        publicId: `${Date.now()}-${randomBytes(4).toString("hex")}`,
      });
    } catch (err) {
      // The resume is already safely uploaded and the HR email below still
      // carries every detail — this only affects the admin applicants list.
      console.error("[careers/apply] application record save failed:", err);
    }

    const mailData = {
      jobTitle: job.title,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      experience: data.experience,
      currentCompany: data.currentCompany,
      noticePeriod: data.noticePeriod,
      coverLetter: data.coverLetter,
      resumeUrl,
      submittedAt,
    };

    // Dedicated lead inbox; falls back to the admin/from address if unset. The
    // resume is already safely in Cloudinary at this point, so a mail failure
    // here must never fail the candidate's request.
    const careersTo =
      env.LEADS_EMAIL ?? env.MAIL_TO_ADMIN ?? env.MAIL_FROM ?? "leads@vertexkashmirholidays.com";
    try {
      await sendMail({
        to: stripHeader(careersTo),
        subject: stripHeader(`New application: ${job.title} — ${data.fullName}`),
        html: careersApplicationHtml(mailData),
        text: careersApplicationText(mailData),
        replyTo: stripHeader(data.email),
      });
    } catch (err) {
      console.error("[careers/apply] notification email failed (resume already uploaded):", err);
    }

    const settings = await getSiteSettings();
    const whatsappUrl = buildWhatsAppHref(
      settings?.whatsapp,
      `Hi, I've applied for the ${job.title} position at Vertex Kashmir Holidays and submitted my details. My name is ${data.fullName}.`,
    );

    return NextResponse.json({ success: true, whatsappUrl }, { status: 200 });
  } catch (err) {
    console.error("[careers/apply] error:", err);
    return NextResponse.json(
      { error: "Could not submit your application. Please try again." },
      { status: 500 },
    );
  }
}
