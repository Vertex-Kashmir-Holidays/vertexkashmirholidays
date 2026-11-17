import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { parseJsonBody, parseWithSchema } from "@/lib/api/route-helpers";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; serviceId: string }> };

// Confirmed goes through hotel-payments (the confirm dialog: token payment or
// a waived token), so only the other statuses are set here.
const bodySchema = z.object({ status: z.enum(["PENDING", "REQUESTED", "CANCELLED"]) });

/** Hotel confirmation status — works after services lock (operations, not the invoice). */
export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id, serviceId } = await params;

  const body = await parseJsonBody(req);
  if (!body.ok) return body.response;
  const parsed = parseWithSchema(bodySchema, body.data);
  if (!parsed.ok) return parsed.response;

  const service = await prisma.bookingService.findFirst({
    where: {
      id: serviceId,
      kind: "HOTEL",
      booking: { id, deletedAt: null, ...(await bookingWhereForUser(role, userId)) },
    },
    select: { id: true },
  });
  if (!service) return NextResponse.json({ error: "Hotel stay not found" }, { status: 404 });

  await prisma.bookingService.update({
    where: { id: serviceId },
    data: {
      hotelConfirmation: parsed.data.status === "PENDING" ? null : parsed.data.status,
      hotelConfirmedAt: null,
      hotelTokenWaived: false,
    },
  });
  return NextResponse.json({ ok: true });
}
