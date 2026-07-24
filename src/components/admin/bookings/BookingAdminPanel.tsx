"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CreditCard,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  Mail,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";

interface BookingAdminPanelProps {
  bookingId: string;
  paymentOption: string | null;
  status: string;
  razorpayOrderId: string | null;
  razorpayPayId: string | null;
  paidAmount: number;
  balance: number;
  paymentStatus: string;
  customer: { email: string; name: string | null; mustChangePassword: boolean } | null;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const OPTION_LABEL: Record<string, string> = {
  ADVANCE: "Advance (10%)",
  FULL: "Full Payment",
};

export function BookingAdminPanel({
  bookingId,
  paymentOption,
  status,
  razorpayOrderId,
  razorpayPayId,
  paidAmount,
  balance,
  paymentStatus,
  customer,
}: BookingAdminPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "verify" | "creds" | "emails">(null);

  async function run(action: "verify" | "creds" | "emails", path: string, okMsg: string) {
    setBusy(action);
    try {
      const res = await fetch(path, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Action failed.");
        return;
      }
      toast.success(json.message ?? okMsg);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground text-right">{value}</dd>
    </div>
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="flex items-center gap-2 font-display font-bold text-foreground text-sm">
        <CreditCard className="w-4 h-4 text-primary" /> Payment &amp; Account
      </h3>

      <dl className="mt-3 divide-y divide-border">
        {row("Payment Type", paymentOption ? (OPTION_LABEL[paymentOption] ?? paymentOption) : "—")}
        {row("Booking Status", <span className="uppercase">{status}</span>)}
        {row("Payment Status", paymentStatus)}
        {row("Amount Paid", inr(paidAmount))}
        {row("Balance Due", inr(balance))}
        {row("Razorpay Order", razorpayOrderId ?? "—")}
        {row("Transaction Ref", razorpayPayId ?? "—")}
        {row(
          "Customer Account",
          customer ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-3.5 h-3.5" />
              {customer.email}
              {customer.mustChangePassword && (
                <span className="ml-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[12px] font-semibold text-amber-600 dark:text-amber-400">
                  awaiting reset
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <UserX className="w-3.5 h-3.5" /> Guest (not linked)
            </span>
          ),
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => run("verify", `/api/bookings/${bookingId}/reconcile`, "Payment verified.")}
          disabled={busy !== null || !razorpayOrderId}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "verify" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5" />
          )}
          Verify Payment
        </button>
        <button
          type="button"
          onClick={() =>
            run("creds", `/api/bookings/${bookingId}/resend-credentials`, "Credentials resent.")
          }
          disabled={busy !== null || !customer}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "creds" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <KeyRound className="w-3.5 h-3.5" />
          )}
          Resend Credentials
        </button>
        <button
          type="button"
          onClick={() =>
            run("emails", `/api/bookings/${bookingId}/resend-emails`, "Emails resent.")
          }
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[14px] font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "emails" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Mail className="w-3.5 h-3.5" />
          )}
          Resend Emails
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[12px] text-muted-foreground">
        <RefreshCw className="w-3 h-3" /> Verify Payment re-checks Razorpay and records a captured
        payment if one was missed.
      </p>
    </div>
  );
}
