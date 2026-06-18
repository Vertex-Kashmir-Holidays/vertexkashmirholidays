import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Payments — Vertex Kashmir Holidays" };
export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default async function AccountPaymentsPage() {
  const session = await auth();
  const payments = await prisma.booking.findMany({
    where: { userId: session!.user.id, status: { in: ["PAID", "REFUNDED"] } },
    orderBy: { updatedAt: "desc" },
    include: { tour: { select: { title: true } } },
  });

  const total = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const statusBadge = (status: string) =>
    status === "PAID"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : "bg-blue-500/15 text-blue-700 dark:text-blue-300";

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
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-semibold text-foreground">{p.tour?.title ?? "Custom booking"}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge(p.status)}`}>
                    {p.status}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="min-w-0 text-xs text-muted-foreground">
                    <p>{p.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <p className="truncate font-mono">{p.razorpayPayId ?? "—"}</p>
                  </div>
                  <p className="shrink-0 font-bold text-foreground">{inr.format(p.amount)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Package</th>
                  <th className="px-4 py-3 font-semibold">Payment ID</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-foreground">{p.tour?.title ?? "Custom booking"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.razorpayPayId ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge(p.status)}`}>
                        {p.status}
                      </span>
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
