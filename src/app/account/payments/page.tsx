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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-brand-navy">Payments</h1>
        <p className="text-sm text-brand-mute">
          Total paid: <span className="font-bold text-brand-navy">{inr.format(total)}</span>
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-brand-line bg-white px-5 py-12 text-center text-sm text-brand-mute">
          No payments on record yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-line text-left text-[11px] uppercase tracking-wide text-brand-mute">
                <th className="px-4 py-3 font-semibold">Package</th>
                <th className="px-4 py-3 font-semibold">Payment ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-brand-navy">{p.tour.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-brand-mute">{p.razorpayPayId ?? "—"}</td>
                  <td className="px-4 py-3 text-brand-mute">
                    {p.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === "PAID"
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                          : "rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-brand-navy">{inr.format(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
