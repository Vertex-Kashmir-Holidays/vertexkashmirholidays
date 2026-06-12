import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail, inquiryNotificationHtml } from "@/lib/mail";

const inquirySchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Valid phone number required"),
  email: z.string().email().optional(),
  travelDate: z.string().optional(),
  travellers: z.coerce.number().int().positive().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = inquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { travelDate, ...rest } = parsed.data;

  const inquiry = await prisma.inquiry.create({
    data: {
      ...rest,
      travelDate: travelDate ? new Date(travelDate) : undefined,
    },
  });

  const adminTo =
    process.env.MAIL_TO_ADMIN ??
    process.env.MAIL_FROM ??
    "admin@vertexkashmirholidays.com";

  await sendMail({
    to: adminTo,
    subject: `New inquiry from ${inquiry.name} (${inquiry.phone})`,
    html: inquiryNotificationHtml({
      name: inquiry.name,
      phone: inquiry.phone,
      email: inquiry.email ?? undefined,
      travelDate: travelDate,
      travellers: inquiry.travellers ?? undefined,
      message: inquiry.message ?? undefined,
      source: inquiry.source ?? undefined,
    }),
  });

  return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 });
}
