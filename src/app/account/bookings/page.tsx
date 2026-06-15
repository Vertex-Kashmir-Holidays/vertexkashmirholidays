import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Bookings — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  REFUNDED: "bg-blue-100 text-blue-700",
};

export default async function AccountBookingsPage() {
  const session = await auth();
  const bookings = await prisma.booking.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { tour: { select: { title: true, slug: true, coverImage: true } } },
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold text-brand-navy">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-brand-line bg-white px-5 py-12 text-center text-sm text-brand-mute">
          You haven&apos;t booked any trips yet.{" "}
          <Link href="/tours" className="font-semibold text-brand-green2 hover:underline">
            Explore packages
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/tours/${b.tour.slug}`} className="text-sm font-bold text-brand-navy hover:underline">
                    {b.tour.title}
                  </Link>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", STATUS_STYLES[b.status])}>
                    {b.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-mute">
                  Travel date:{" "}
                  {b.travelDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  {" · "}
                  {b.travellers} traveller{b.travellers > 1 ? "s" : ""}
                  {" · "}
                  Booked {b.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="mt-0.5 text-[11px] text-brand-mute">Ref: {b.razorpayOrderId}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-brand-navy">{inr.format(b.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
