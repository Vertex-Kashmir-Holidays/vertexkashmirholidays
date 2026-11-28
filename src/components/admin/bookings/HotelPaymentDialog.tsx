"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Loader2, Mail, Wallet } from "lucide-react";
import { round2 } from "@/lib/bookings/finance";
import { PAYMENT_METHODS, isCashMethod } from "@/lib/payments/gst";
import {
  HOTEL_PAYMENT_TYPE_LABEL,
  nextHotelPaymentType,
  type HotelPaymentRow,
  type HotelPaymentTypeValue,
} from "@/lib/bookings/hotelPayments";

/** One hotel stay the dialog pays/confirms — built by the booking and hotel pages. */
export interface HotelPaymentTarget {
  bookingId: string;
  serviceId: string;
  hotelName: string;
  guestName: string;
  /** Prefill for the email, e.g. "6 adults, 2 kids". */
  guests: string;
  hotelEmail: string | null;
  /** Booking amount with the hotel (the stay's service amount). */
  total: number;
  payments: { amount: number; type: string }[];
  tokenWaived: boolean;
}

export interface HotelPaymentResult {
  payment: HotelPaymentRow | null;
  confirmed: boolean;
  tokenWaived: boolean;
}

const MEAL_PLANS = ["EP", "CP", "MAP", "AP"];
const MAX_RECEIPT_BYTES = 1024 * 1024;

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const inputCls =
  "mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";
const labelCls = "text-[12px] font-bold text-muted-foreground uppercase tracking-wide";

/** Phone photos are often several MB — shrink a JPG/PNG to fit the 1 MB limit. */
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= MAX_RECEIPT_BYTES) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.75));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

/**
 * Confirm a hotel stay and/or record a payment to the hotel — one form for
 * both, used from the Hotel Confirmation status (mode "confirm") and from
 * "Add payment" (mode "payment"). Optionally emails the hotel the
 * reservation + payment details.
 */
export function HotelPaymentDialog({
  mode,
  target,
  defaultPaidBy,
  onClose,
  onDone,
}: {
  mode: "confirm" | "payment";
  target: HotelPaymentTarget;
  defaultPaidBy: string;
  onClose: () => void;
  onDone: (result: HotelPaymentResult) => void;
}) {
  const paid = round2(target.payments.reduce((s, p) => s + p.amount, 0));
  const balance = round2(target.total - paid);

  const [waived, setWaived] = useState(false);
  const [askWaive, setAskWaive] = useState(false);
  const [type, setType] = useState<HotelPaymentTypeValue>(
    nextHotelPaymentType(target.payments, target.tokenWaived),
  );
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("UPI");
  const [paidBy, setPaidBy] = useState(defaultPaidBy);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [sendEmail, setSendEmail] = useState(!!target.hotelEmail);
  const [emailTo, setEmailTo] = useState(target.hotelEmail ?? "");
  const [guests, setGuests] = useState(target.guests);
  const [mealPlan, setMealPlan] = useState("MAP");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const noPayment = mode === "confirm" && waived;
  // Cash often has no receipt; every other method needs one.
  const receiptRequired = !isCashMethod(method);

  function validate(): string | null {
    if (!noPayment) {
      if (target.total <= 0) return "Set this hotel's amount in Booking Services first.";
      const n = parseFloat(amount);
      if (!(n > 0)) return "Enter the amount paid.";
      if (round2(paid + n) > target.total) return `That's more than the balance due (${inr(balance)}).`;
      if (!paidBy.trim()) return "Enter who paid (By).";
      if (receiptRequired && !receipt) return "Attach the payment receipt (only cash can skip it).";
    }
    if (sendEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim())) {
      return "Enter the hotel's email address.";
    }
    return null;
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const err = validate();
    if (err) return setError(err);
    // Confirming with no token gets a second "are you sure".
    if (noPayment && !askWaive) return setAskWaive(true);
    setError(null);

    start(async () => {
      const fd = new FormData();
      if (mode === "confirm") fd.set("confirm", "1");
      if (noPayment) {
        fd.set("tokenWaived", "1");
      } else {
        fd.set("amount", amount);
        fd.set("type", type);
        fd.set("method", method);
        fd.set("paidBy", paidBy.trim());
        if (receipt) {
          const f = await shrinkImage(receipt);
          if (f.size > MAX_RECEIPT_BYTES) {
            setError("Receipt is too large — maximum size is 1 MB.");
            return;
          }
          fd.set("receipt", f);
        }
      }
      if (sendEmail) {
        fd.set("sendEmail", "1");
        fd.set("emailTo", emailTo.trim());
        fd.set("guests", guests.trim());
        fd.set("mealPlan", mealPlan.trim());
      }
      try {
        const res = await fetch(
          `/api/bookings/${target.bookingId}/services/${target.serviceId}/hotel-payments`,
          { method: "POST", body: fd },
        );
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          emailed?: boolean;
          payment?: HotelPaymentRow | null;
        };
        if (!res.ok) {
          setError(j.error ?? "Save failed.");
          setAskWaive(false);
          return;
        }
        const what = mode === "confirm" ? "Hotel confirmed" : "Payment recorded";
        if (sendEmail && !j.emailed) toast.warning(`${what}, but the email to the hotel failed to send.`);
        else toast.success(sendEmail ? `${what} and emailed to the hotel.` : `${what}.`);
        onDone({ payment: j.payment ?? null, confirmed: mode === "confirm", tokenWaived: noPayment });
      } catch {
        setError("An error occurred.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4"
      >
        <div>
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            {mode === "confirm" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Wallet className="w-4 h-4 text-primary" />
            )}
            {mode === "confirm" ? "Confirm hotel" : "Add payment to hotel"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{target.hotelName}</span> · {target.guestName}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3 text-center">
          {[
            ["Booking total", inr(target.total)],
            ["Paid", inr(paid)],
            ["Balance", inr(balance)],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="text-sm font-extrabold text-foreground">{v}</p>
            </div>
          ))}
        </div>

        {mode === "confirm" && (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={waived}
              onChange={(e) => {
                setWaived(e.target.checked);
                setAskWaive(false);
                setError(null);
              }}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-foreground">Token amount not needed</span>
              <span className="block text-xs text-muted-foreground">The hotel confirmed without a token payment.</span>
            </span>
          </label>
        )}

        {!noPayment && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>{mode === "confirm" ? "Confirmed amount" : "Amount"}</span>
              <input
                type="number"
                min={1}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={balance > 0 ? String(balance) : ""}
                className={inputCls}
                autoFocus
              />
            </label>
            <label className="block">
              <span className={labelCls}>Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as HotelPaymentTypeValue)} className={inputCls}>
                {(Object.keys(HOTEL_PAYMENT_TYPE_LABEL) as HotelPaymentTypeValue[]).map((t) => (
                  <option key={t} value={t}>
                    {HOTEL_PAYMENT_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Via</span>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>By</span>
              <input value={paidBy} onChange={(e) => setPaidBy(e.target.value)} placeholder="Who paid" className={inputCls} />
            </label>
            <label className="block col-span-2">
              <span className={labelCls}>
                Receipt{receiptRequired ? <span className="text-red-500"> *</span> : " (optional for cash)"}
              </span>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
              />
              <span className="text-[11px] text-muted-foreground">
                PDF, JPG or PNG · required unless paid in cash
              </span>
            </label>
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-border p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            <Mail className="w-4 h-4 text-primary" /> Email the hotel the booking
            {noPayment ? "" : " & payment"} details
          </label>
          {sendEmail && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block col-span-2">
                <span className={labelCls}>Hotel email</span>
                <input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className={labelCls}>Number of guests</span>
                <input
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="6 adults, 2 kids (5 yrs & 1 yr)"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Meal plan</span>
                <input list="hotel-meal-plans" value={mealPlan} onChange={(e) => setMealPlan(e.target.value)} className={inputCls} />
                <datalist id="hotel-meal-plans">
                  {MEAL_PLANS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </label>
            </div>
          )}
        </div>

        {askWaive && (
          <div className="flex gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Are you sure you want to confirm this hotel <strong>without a token amount</strong>? Only do this when the
              hotel has agreed to hold the rooms without one.
            </span>
          </div>
        )}
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className={
              "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl text-white disabled:opacity-50 " +
              (askWaive ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-primary/90")
            }
          >
            {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {askWaive
              ? "Yes, confirm without token"
              : mode === "confirm"
                ? "Confirm hotel"
                : "Save payment"}
          </button>
        </div>
      </form>
    </div>
  );
}
