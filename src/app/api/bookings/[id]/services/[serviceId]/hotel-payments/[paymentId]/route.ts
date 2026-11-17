import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import type { Role } from "@/lib/rbac";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; serviceId: string; paymentId: string }> };

/** Remove a payment to a hotel recorded by mistake. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "edit");
  if (guard instanceof NextResponse) return guard;
  const role = guard.user.role as Role;
  const userId = guard.user.id as string;
  const { id, serviceId, paymentId } = await params;

  const payment = await prisma.hotelPayment.findFirst({
    where: {
      id: paymentId,
      serviceId,
      service: { booking: { id, ...(await bookingWhereForUser(role, userId)) } },
    },
    select: { id: true },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  await prisma.hotelPayment.delete({ where: { id: paymentId } });
  return NextResponse.json({ ok: true });
}
