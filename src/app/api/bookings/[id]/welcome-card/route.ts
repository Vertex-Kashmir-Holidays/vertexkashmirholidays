import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions";
import { bookingWhereForUser } from "@/lib/bookings/scope";
import { PDF_CONTACT } from "@/lib/pdf/contact";
import type { Role } from "@/lib/rbac";
import { isSalutation, splitSalutation } from "@/lib/welcomeCard/salutation";
import {
  isWelcomeCardAvailable,
  renderWelcomeCardPdf,
  welcomeCardAvailableFrom,
  welcomeCardFilename,
} from "@/lib/welcomeCard/pdf";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const longDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

/** Travellers on the trip — the lead's adults + children when converted from a
 *  lead, else the booking's traveller count. */
function partySize(b: { travellers: number; leads: { adults: number; children: number | null }[] }): number {
  const l = b.leads[0];
  return l ? l.adults + (l.children ?? 0) : b.travellers;
}

/** The guest welcome card (A4 landscape) for the driver — available from the
 *  day before travel. One name, with "& Family" for 3+ travellers.
 *  ?inline=1 opens it in the browser instead. */
export async function GET(req: NextRequest, { params }: Params) {
  const guard = await requirePermission("bookings", "view");
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(await bookingWhereForUser(guard.user.role as Role, guard.user.id as string)),
    },
    select: {
      guestName: true,
      travelDate: true,
      status: true,
      travellers: true,
      leads: { take: 1, select: { adults: true, children: true } },
    },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (["CANCELLED", "FAILED", "REFUNDED"].includes(booking.status)) {
    return NextResponse.json({ error: "This booking is not active." }, { status: 409 });
  }
  if (!isWelcomeCardAvailable(booking.travelDate)) {
    const from = new Date(`${welcomeCardAvailableFrom(booking.travelDate)}T00:00:00Z`);
    return NextResponse.json(
      { error: `The welcome card can be downloaded from ${longDate(from)}, the day before travel.` },
      { status: 409 },
    );
  }

  // ?title=Mr|Ms|Mrs|Dr (picked when downloading); otherwise keep any title
  // already typed in the guest name. ?title=none prints the name alone.
  const split = splitSalutation(booking.guestName);
  const asked = req.nextUrl.searchParams.get("title");
  const title = isSalutation(asked) ? asked : asked === "none" ? null : split.title;
  const bare = split.name;

  const pdf = await renderWelcomeCardPdf({
    name: [title, bare].filter(Boolean).join(" "),
    family: partySize(booking) > 2,
    arrivalDate: longDate(booking.travelDate),
    phone: PDF_CONTACT.phone.split("/")[0].trim(),
    website: "vertexkashmirholidays.com",
  });
  const disposition = req.nextUrl.searchParams.get("inline") === "1" ? "inline" : "attachment";
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${welcomeCardFilename(bare)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
