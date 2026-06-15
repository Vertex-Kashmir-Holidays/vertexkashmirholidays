import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CreditCard, MapPin, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "My Account — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default async function AccountOverviewPage() {
  const session = await auth();
  const userId = session!.user.id;
  const now = new Date();

  const [bookings, paid] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      orderBy: { travelDate: "asc" },
      take: 3,
      include: { tour: { select: { title: true, slug: true } } },
    }),
    prisma.booking.findMany({
      where: { userId, status: "PAID" },
      select: { amount: true },
    }),
  ]);

  const totalBookings = await prisma.booking.count({ where: { userId } });
  const upcoming = bookings.filter((b) => b.travelDate >= now).length;
  const totalSpent = paid.reduce((sum, b) => sum + b.amount, 0);

  const stats = [
    { label: "Total Bookings", value: String(totalBookings), Icon: CalendarDays },
    { label: "Upcoming Trips", value: String(upcoming), Icon: MapPin },
    { label: "Total Spent", value: inr.format(totalSpent), Icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-navy">
          Welcome back, {session!.user.name ?? "Traveller"} 👋
        </h1>
        <p className="text-sm text-brand-mute">Here&apos;s a quick look at your trips with us.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-2xl border border-brand-line bg-white p-5">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-brand-green">
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-brand-navy">{value}</p>
            <p className="text-xs text-brand-mute">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brand-line bg-white">
        <div className="flex items-center justify-between border-b border-brand-line px-5 py-4">
          <h2 className="font-display font-bold text-brand-navy">Recent Bookings</h2>
          <Link href="/account/bookings" className="flex items-center gap-1 text-xs font-semibold text-brand-green2 hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {bookings.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-brand-mute">
            You have no bookings yet.{" "}
            <Link href="/tours" className="font-semibold text-brand-green2 hover:underline">
              Browse packages
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-brand-line">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-brand-navy">{b.tour.title}</p>
                  <p className="text-xs text-brand-mute">
                    {b.travelDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    {b.travellers} traveller{b.travellers > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-navy">{inr.format(b.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
