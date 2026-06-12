import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  tourId: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

export async function POST(request: Request) {
  const session = await auth();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Ensure the tour exists and is published
  const tour = await prisma.tour.findFirst({
    where: { id: parsed.data.tourId, published: true },
    select: { id: true },
  });
  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  await prisma.review.create({
    data: {
      tourId: parsed.data.tourId,
      name: parsed.data.name,
      rating: parsed.data.rating,
      body: parsed.data.body,
      approved: false,
      ...(session?.user?.id ? { userId: session.user.id } : {}),
    },
  });

  return NextResponse.json(
    { message: "Review submitted — it will appear after moderation." },
    { status: 201 },
  );
}
