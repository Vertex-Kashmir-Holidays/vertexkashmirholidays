"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeCheck,
  ChevronDown,
  FileText,
  Loader2,
  Mail,
  Plus,
  ReceiptIndianRupee,
  Trash2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmationBadge, fmtDay } from "@/components/admin/trips/TripBits";
import { HotelPaymentDialog } from "@/components/admin/bookings/HotelPaymentDialog";
import {
  HOTEL_PAYMENT_TYPE_LABEL,
  hotelPaymentSummary,
  type HotelPaymentRow,
} from "@/lib/bookings/hotelPayments";
import type { HotelStay } from "@/lib/trips/types";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * "Bookings given to this hotel" — each stay with what we owe the hotel, what
 * we've paid and the balance; Payments expands the payment history and adds
 * payments through the same dialog as the booking's Hotel Confirmation.
 */
export function HotelStaysTable({
  stays: initial,
  hotelEmail,
  canPay,
  currentUserName,
}: {
  stays: HotelStay[];
  hotelEmail: string | null;
  /** `bookings:edit` — record/remove payments. */
  canPay: boolean;
  currentUserName: string;
}) {
  const router = useRouter();
  const [stays, setStays] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [paying, setPaying] = useState<HotelStay | null>(null);
  const [deleting, startDelete] = useTransition();

  const setPayments = (stayId: string, fn: (p: HotelPaymentRow[]) => HotelPaymentRow[]) =>
    setStays((prev) => prev.map((s) => (s.id === stayId ? { ...s, payments: fn(s.payments ?? []) } : s)));

  function removePayment(st: HotelStay, p: HotelPaymentRow) {
    if (!window.confirm(`Remove the ${inr(p.amount)} payment?`)) return;
    startDelete(async () => {
      const res = await fetch(`/api/bookings/${st.bookingId}/services/${st.id}/hotel-payments/${p.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Delete failed.");
        return;
      }
      setPayments(st.id, (list) => list.filter((x) => x.id !== p.id));
      toast.success("Payment removed.");
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2 font-semibold">Customer</th>
            <th className="px-4 py-2 font-semibold">Check-in</th>
            <th className="px-4 py-2 font-semibold">Check-out</th>
            <th className="px-4 py-2 font-semibold">Nights</th>
            <th className="px-4 py-2 font-semibold">Rooms</th>
            <th className="px-4 py-2 font-semibold">Room type</th>
            <th className="px-4 py-2 text-right font-semibold">Total</th>
            <th className="px-4 py-2 text-right font-semibold">Paid</th>
            <th className="px-4 py-2 text-right font-semibold">Balance</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            <th className="px-4 py-2 font-semibold">Salesperson</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {stays.map((st) => {
            const sum = hotelPaymentSummary(st.amount ?? 0, st.payments ?? []);
            const isOpen = open === st.id;
            const href = `/admin/bookings/${st.bookingId}/services`;
            return (
              <Fragment key={st.id}>
                <tr onClick={() => router.push(href)} className="cursor-pointer hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <Link href={href} className="font-semibold text-foreground hover:text-primary">
                      {st.guestName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {st.bookingRef} · {st.travellers} pax · {st.guestPhone}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5">{fmtDay(st.checkIn, true)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">{fmtDay(st.checkOut, true)}</td>
                  <td className="px-4 py-2.5">{st.nights ?? "—"}</td>
                  <td className="px-4 py-2.5">{st.rooms ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{st.roomType ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">{inr(sum.total)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">{inr(sum.paid)}</td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-4 py-2.5 text-right font-semibold",
                      sum.balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600",
                    )}
                  >
                    {inr(sum.balance)}
                  </td>
                  <td className="px-4 py-2.5">
                    <ConfirmationBadge status={st.confirmation} />
                    {st.tokenWaived && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Token not needed</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{st.assigneeName ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpen(isOpen ? null : st.id);
                      }}
                      aria-expanded={isOpen}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
                    >
                      <Wallet className="h-3.5 w-3.5" /> Payments
                      {(st.payments?.length ?? 0) > 0 && (
                        <span className="rounded-full bg-muted px-1.5 text-[10px]">{st.payments!.length}</span>
                      )}
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={12} className="bg-muted/20 px-4 py-4">
                      <PaymentsPanel
                        stay={st}
                        canPay={canPay}
                        deleting={deleting}
                        onAdd={() => setPaying(st)}
                        onRemove={(p) => removePayment(st, p)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {paying && (
        <HotelPaymentDialog
          mode="payment"
          target={{
            bookingId: paying.bookingId,
            serviceId: paying.id,
            hotelName: paying.name,
            guestName: paying.guestName,
            guests: paying.guestsLabel ?? `${paying.travellers} guests`,
            hotelEmail,
            total: paying.amount ?? 0,
            payments: paying.payments ?? [],
            tokenWaived: paying.tokenWaived ?? false,
          }}
          defaultPaidBy={currentUserName}
          onClose={() => setPaying(null)}
          onDone={(r) => {
            if (r.payment) setPayments(paying.id, (list) => [...list, r.payment!]);
            setPaying(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/** Expanded payments for one stay: totals with progress, then a payment timeline. */
function PaymentsPanel({
  stay,
  canPay,
  deleting,
  onAdd,
  onRemove,
}: {
  stay: HotelStay;
  canPay: boolean;
  deleting: boolean;
  onAdd: () => void;
  onRemove: (p: HotelPaymentRow) => void;
}) {
  const payments = stay.payments ?? [];
  const sum = hotelPaymentSummary(stay.amount ?? 0, payments);
  const pct = sum.total > 0 ? Math.min(100, Math.round((sum.paid / sum.total) * 100)) : 0;
  const settled = sum.total > 0 && sum.balance <= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Totals */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border p-4">
        <div className="grid flex-1 grid-cols-3 gap-3">
          {[
            { label: "Booking total", value: inr(sum.total), cls: "text-foreground" },
            { label: "Already paid", value: inr(sum.paid), cls: "text-emerald-600 dark:text-emerald-400" },
            {
              label: "Balance",
              value: inr(Math.max(0, sum.balance)),
              cls: settled ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            },
          ].map((k) => (
            <div key={k.label} className="rounded-xl bg-muted/40 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className={cn("mt-0.5 text-lg font-extrabold tabular-nums", k.cls)}>{k.value}</p>
            </div>
          ))}
        </div>
        {canPay && !settled && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add payment
          </button>
        )}
      </div>
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span>{settled ? "Fully paid" : `${pct}% paid`}</span>
          {stay.tokenWaived && <span>Token not needed</span>}
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", settled ? "bg-emerald-500" : "bg-amber-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
          <ReceiptIndianRupee className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">No payments yet</p>
          <p className="text-xs text-muted-foreground">Token and balance payments to the hotel will show here.</p>
        </div>
      ) : (
        <ul className="space-y-2 p-4">
          {payments.map((p) => {
            const token = p.type === "TOKEN";
            return (
              <li
                key={p.id}
                className="group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-background/40 px-3.5 py-3"
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    token ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {token ? <Wallet className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-extrabold tabular-nums text-foreground">{inr(p.amount)}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        token ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                      )}
                    >
                      {HOTEL_PAYMENT_TYPE_LABEL[p.type]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fmtWhen(p.createdAt)} · via <span className="font-semibold text-foreground">{p.method}</span> · by{" "}
                    <span className="font-semibold text-foreground">{p.paidBy}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.receiptUrl ? (
                    <a
                      href={p.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-primary hover:bg-muted"
                    >
                      <FileText className="h-3.5 w-3.5" /> Receipt
                    </a>
                  ) : (
                    <span className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground">No receipt</span>
                  )}
                  {p.emailedTo ? (
                    <span
                      title={`Emailed to ${p.emailedTo}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      <Mail className="h-3.5 w-3.5" /> Emailed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> Not emailed
                    </span>
                  )}
                  {canPay && (
                    <button
                      type="button"
                      onClick={() => onRemove(p)}
                      disabled={deleting}
                      title="Remove payment"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
