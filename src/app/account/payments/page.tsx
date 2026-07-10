import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { customerBookingWhere } from "@/lib/account/bookingScope";

export const metadata: Metadata = { title: "Payments — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const TYPE_LABELS: Record<string, string> = {
  TOKEN: "Token / Advance",
  PARTIAL: "Partial",
  FINAL: "Final",
  REFUND: "Refund",
};

const TYPE_STYLES: Record<string, string> = {
  TOKEN: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  PARTIAL: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  FINAL: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  REFUND: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
};

export default async function AccountPaymentsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // The complete payment ledger across the customer's bookings — includes online
  // (Razorpay) payments AND payments recorded internally by staff. Scoped to the
  // authenticated user (by account or verified email) via the booking relation.
  const payments = await prisma.bookingPayment.findMany({
    where: { booking: customerBookingWhere(session.user.id, session.user.email) },
    orderBy: { createdAt: "desc" },
    include: { booking: { select: { id: true, tour: { select: { title: true } } } } },
  });

  // Net total received = all non-refund payments minus refunds.
  const total = payments.reduce(
    (sum, p) => sum + (p.type === "REFUND" ? -p.amount : p.amount),
    0,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Total paid: <span className="font-bold text-foreground">{inr.format(total)}</span>
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground">
          No payments on record yet.
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="space-y-3 md:hidden">
            {payments.map((p) => (
              <Link key={p.id} href={`/account/bookings/${p.booking.id}`} className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-semibold text-foreground">{p.booking.tour?.title ?? "Custom booking"}</p>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", TYPE_STYLES[p.type] ?? "bg-muted text-muted-foreground")}>
                    {TYPE_LABELS[p.type] ?? p.type}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <p>{p.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="truncate">Ref: {p.booking.id.slice(-8).toUpperCase()}{p.method ? ` · ${p.method}` : ""}</p>
                  </div>
                  <p className="shrink-0 font-bold text-foreground">{inr.format(p.amount)}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Booking</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="transition hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link href={`/account/bookings/${p.booking.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                        {p.booking.tour?.title ?? "Custom booking"}
                      </Link>
                      <span className="ml-1 text-[11px] text-muted-foreground">#{p.booking.id.slice(-8).toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", TYPE_STYLES[p.type] ?? "bg-muted text-muted-foreground")}>
                        {TYPE_LABELS[p.type] ?? p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.method ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">{inr.format(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
