import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { parseJsonBody, parseWithSchema, requireExisting, mapPrismaError } from "@/lib/api/route-helpers";
import { patchHotelSupplierSchema } from "@/lib/hotelSuppliers/schema";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("hotelSuppliers", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const hotel = await requireExisting(() => prisma.hotelSupplier.findUnique({ where: { id } }));
  if (!hotel.ok) return hotel.response;
  return NextResponse.json(hotel.data);
}

// Whole-hotel PATCH — used both for editing top-level fields (name,
// destination, category, isActive) and for saving the full `data` blob
// (property contact info + rates array) after an inline edit / add / delete
// on the client. The client always sends the complete `data` object it wants
// persisted; there's no per-rate-path update, which keeps this a single
// straightforward write instead of juggling JSONB path operators for a
// dataset this small (see .ai ticket: avoid querying arbitrary JSON paths).
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("hotelSuppliers", "edit");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.hotelSupplier.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(patchHotelSupplierSchema, body.data);
  if (!parsed.ok) return parsed.response;

  try {
    const updated = await prisma.hotelSupplier.update({ where: { id }, data: parsed.data });
    return NextResponse.json(updated);
  } catch (err) {
    return mapPrismaError(err, "Hotel already exists", "Update failed");
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("hotelSuppliers", "delete");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const existing = await requireExisting(() => prisma.hotelSupplier.findUnique({ where: { id } }));
  if (!existing.ok) return existing.response;
  await prisma.hotelSupplier.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
