import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, mapPrismaError } from "@/lib/api/route-helpers";
import { createHotelSupplierSchema } from "@/lib/hotelSuppliers/schema";

export const dynamic = "force-dynamic";

// Small reference dataset (a few hundred rows at most) — list everything and
// let the client tab/filter/search, same as Destinations. No pagination.
export async function GET() {
  const guard = await requirePermission("hotelSuppliers", "view");
  if (guard instanceof NextResponse) return guard;

  const hotels = await prisma.hotelSupplier.findMany({
    orderBy: [{ destination: "asc" }, { hotelName: "asc" }],
  });
  return NextResponse.json(hotels);
}

export async function POST(request: NextRequest) {
  const guard = await requirePermission("hotelSuppliers", "create");
  if (guard instanceof NextResponse) return guard;

  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(createHotelSupplierSchema, body.data);
  if (!parsed.ok) return parsed.response;

  try {
    const hotel = await prisma.hotelSupplier.create({ data: parsed.data });
    return NextResponse.json(hotel, { status: 201 });
  } catch (err) {
    return mapPrismaError(err, "Hotel already exists", "Create failed");
  }
}
