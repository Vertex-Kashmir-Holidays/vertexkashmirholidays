"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Mail, XCircle } from "lucide-react";

/** One hotel stay to cancel with the hotel. */
export interface HotelCancelTarget {
  bookingId: string;
  serviceId: string;
  hotelName: string;
  guestName: string;
  /** Prefill for the email, e.g. "6 adults, 2 kids". */
  guests: string;
  hotelEmail: string | null;
}

const MEAL_PLANS = ["EP", "CP", "MAP", "AP"];
const REASONS = [
  "The guest has cancelled the trip",
  "The guest has changed the travel dates",
  "The guest has opted for a different hotel",
  "The guest has changed the itinerary",
];

const inputCls =
  "mt-1 w-full px-3 py-2 text-sm border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";
const labelCls = "text-[12px] font-bold text-muted-foreground uppercase tracking-wide";

/**
 * Cancel a hotel stay with a reason, optionally emailing the hotel a
 * cancellation notice with the booking details (same layout as the
 * confirmation email). Opened from the stay's Hotel Confirmation status.
 */
export function HotelCancelDialog({
  target,
  onClose,
  onDone,
}: {
  target: HotelCancelTarget;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [sendEmail, setSendEmail] = useState(!!target.hotelEmail);
  const [emailTo, setEmailTo] = useState(target.hotelEmail ?? "");
  const [guests, setGuests] = useState(target.guests);
  const [mealPlan, setMealPlan] = useState("MAP");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return setError("Enter the reason for cancelling.");
    if (sendEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTo.trim())) {
      return setError("Enter the hotel's email address.");
    }
    setError(null);
    start(async () => {
      try {
        const res = await fetch(`/api/bookings/${target.bookingId}/services/${target.serviceId}/hotel-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "CANCELLED",
            reason: reason.trim(),
            sendEmail,
            ...(sendEmail ? { emailTo: emailTo.trim(), guests: guests.trim(), mealPlan: mealPlan.trim() } : {}),
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean };
        if (!res.ok) return setError(j.error ?? "Save failed.");
        if (sendEmail && !j.emailed) toast.warning("Hotel cancelled, but the email to the hotel failed to send.");
        else toast.success(sendEmail ? "Hotel cancelled and the hotel has been emailed." : "Hotel cancelled.");
        onDone();
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
            <XCircle className="w-4 h-4 text-red-600" /> Cancel hotel booking
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{target.hotelName}</span> · {target.guestName}
          </p>
        </div>

        <label className="block">
          <span className={labelCls}>
            Reason<span className="text-red-500"> *</span>
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Why is this booking being cancelled?"
            className={inputCls}
            autoFocus
          />
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary hover:text-primary"
              >
                {r}
              </button>
            ))}
          </span>
        </label>

        <div className="space-y-3 rounded-xl border border-border p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
            <Mail className="w-4 h-4 text-primary" /> Email the hotel the cancellation with booking details
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
                <input list="hotel-cancel-meal-plans" value={mealPlan} onChange={(e) => setMealPlan(e.target.value)} className={inputCls} />
                <datalist id="hotel-cancel-meal-plans">
                  {MEAL_PLANS.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </label>
            </div>
          )}
        </div>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted"
          >
            Keep booking
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Cancel hotel booking
          </button>
        </div>
      </form>
    </div>
  );
}
