import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const newsletterSchema = z.object({
  email: z.string().email("Valid email required"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  await prisma.inquiry.create({
    data: {
      name: email,
      phone: "newsletter",
      email,
      source: "newsletter",
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
