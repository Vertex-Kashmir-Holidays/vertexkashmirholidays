import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Car, Ticket, Package, CalendarDays, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { computeBookingFinance } from "@/lib/bookings/finance";
import { groupServices, serviceDetailLine, parseInclusions, type ServiceKind } from "@/lib/bookings/serviceDisplay";

export const metadata: Metadata = { title: "Booking Details — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_STYLES: Record<string, string> = {
  PAID: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-300",
  CANCELLED: "bg-muted text-muted-foreground",
  REFUNDED: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
};

const KIND_ICONS: Record<ServiceKind, typeof MapPin> = {
  HOTEL: MapPin,
  TRANSPORT: Car,
  ACTIVITY: Ticket,
  OTHER: Package,
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  TOKEN: "Token",
  PARTIAL: "Partial",
  FINAL: "Final",
  REFUND: "Refund",
};

type PageProps = { params: Promise<{ id: string }> };

function paymentStatusLabel(payable: number, paid: number): string {
  if (paid <= 0) return "Unpaid";
  if (paid >= payable) return "Fully Paid";
  return "Partially Paid";
}

export default async function AccountBookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;

  // Scope strictly to the authenticated customer — never another user's booking.
  const booking = await prisma.booking.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      tour: { select: { title: true } },
      services: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking) notFound();

  const finance = computeBookingFinance({
    amount: booking.amount,
    discountType: booking.discountType,
    discountValue: booking.discountValue,
    payments: booking.payments,
    services: booking.services,
  });

  const grouped = groupServices(booking.services);
  const inclusions = parseInclusions(booking.inclusions);
  const ref = booking.id.slice(-8).toUpperCase();
  const statusLabel = paymentStatusLabel(finance.effectivePayable, finance.paidAmount);

  return (
    <div className="space-y-5">
      <Link href="/account/bookings" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to my bookings
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">{booking.tour?.title ?? "Custom Booking"}</h1>
            <p className="mt-1 text-xs text-muted-foreground">Ref: {ref}</p>
          </div>
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_STYLES[booking.status] ?? "bg-muted text-muted-foreground")}>
            {booking.status}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">Travel date</p>
              <p className="font-semibold text-foreground">{booking.travelDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">Travellers</p>
              <p className="font-semibold text-foreground">{booking.travellers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service details — no per-service prices */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display font-bold text-foreground">Your Trip Includes</h2>
        {grouped.length === 0 && inclusions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Service details will appear here once your trip is finalised.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {grouped.map((g) => {
              const Icon = KIND_ICONS[g.kind];
              return (
                <div key={g.kind}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
                    <Icon className="h-3.5 w-3.5" /> {g.label}
                  </p>
                  <ul className="space-y-2">
                    {g.items.map((s) => {
                      const detail = serviceDetailLine(s);
                      return (
                        <li key={s.id} className="rounded-xl border border-border px-3 py-2">
                          <p className="text-sm font-semibold text-foreground">{s.name}</p>
                          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            {inclusions.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Additional Inclusions</p>
                <div className="flex flex-wrap gap-2">
                  {inclusions.map((inc, i) => (
                    <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">{inc}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price summary */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display font-bold text-foreground">Price Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Total Booking Amount" value={inr.format(finance.bookingAmount)} />
          {finance.discountAmount > 0 && <Row label="Discount" value={`– ${inr.format(finance.discountAmount)}`} />}
          <Row label="Payable" value={inr.format(finance.effectivePayable)} strong />
          <Row label="Paid" value={inr.format(finance.paidAmount)} />
          <div className="border-t border-border pt-2">
            <Row label="Remaining Balance" value={inr.format(finance.balance)} strong />
          </div>
        </dl>
        <span className="mt-3 inline-block rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{statusLabel}</span>
      </div>

      {/* Payment history for this booking */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display font-bold text-foreground">Payment History</h2>
        {booking.payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="py-2 pr-3 font-semibold">Method</th>
                  <th className="py-2 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {booking.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{p.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="py-2 pr-3 font-semibold text-foreground">{PAYMENT_TYPE_LABELS[p.type] ?? p.type}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{p.method ?? "—"}</td>
                    <td className="py-2 text-right font-bold text-foreground">{inr.format(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-foreground", strong ? "font-extrabold" : "font-semibold")}>{value}</dd>
    </div>
  );
}
