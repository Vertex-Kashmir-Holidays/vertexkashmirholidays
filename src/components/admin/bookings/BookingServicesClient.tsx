"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Lock, Save, X, Hotel, Car, Ticket, Package, Wallet, CheckCircle2, Mail, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeBookingFinance, round2 } from "@/lib/bookings/finance";

type Kind = "HOTEL" | "TRANSPORT" | "ACTIVITY" | "OTHER";

interface Service {
  id: string;
  kind: Kind;
  name: string;
  amount: number;
  location: string | null;
  nights: number | null;
  pickup: string | null;
  dropoff: string | null;
  timing: string | null;
  sortOrder: number;
}

interface Payment {
  id: string;
  amount: number;
  type: string;
  method: string | null;
  reference: string | null;
  note: string | null;
  createdAt: string;
}

interface BookingData {
  id: string;
  amount: number;
  status: string;
  servicesLocked: boolean;
  discountType: string | null;
  discountValue: number;
  inclusions: string[];
  travelDate: string;
  travellers: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string;
  tourTitle: string | null;
  customer: { name: string | null; email: string } | null;
  lead: { id: string; name: string; phone: string; email: string | null; assignedTo: { name: string | null; email: string } | null } | null;
  services: Service[];
  payments: Payment[];
}

type FieldKey = "name" | "location" | "nights" | "pickup" | "dropoff" | "timing" | "amount";
interface FieldDef { key: FieldKey; label: string; type: "text" | "number"; }

const SECTIONS: { kind: Kind; title: string; icon: typeof Hotel; addLabel: string; fields: FieldDef[] }[] = [
  {
    kind: "HOTEL", title: "Hotel Details", icon: Hotel, addLabel: "Add Hotel",
    fields: [
      { key: "name", label: "Hotel Name", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "nights", label: "Nights", type: "number" },
      { key: "amount", label: "Amount", type: "number" },
    ],
  },
  {
    kind: "TRANSPORT", title: "Transport", icon: Car, addLabel: "Add Cab",
    fields: [
      { key: "name", label: "Cab Name", type: "text" },
      { key: "pickup", label: "Pick", type: "text" },
      { key: "dropoff", label: "Drop", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
    ],
  },
  {
    kind: "ACTIVITY", title: "Activities", icon: Ticket, addLabel: "Add Activity",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "timing", label: "Timing", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "amount", label: "Price", type: "number" },
    ],
  },
  {
    kind: "OTHER", title: "Other", icon: Package, addLabel: "Add Item",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
    ],
  },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const inputCls =
  "w-full px-2.5 py-1.5 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary disabled:opacity-60";

let draftSeq = 0;

export function BookingServicesClient({ booking }: { booking: BookingData }) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(booking.services);
  const [drafts, setDrafts] = useState<Service[]>([]);
  // Live amounts lifted from rows on blur (keyed by row id, drafts included), so
  // totals recalc as soon as an amount field is edited — no per-row save needed.
  // Persistence still happens via each row's Save button.
  const [liveAmounts, setLiveAmounts] = useState<Record<string, number>>({});
  const [payments, setPayments] = useState<Payment[]>(booking.payments);
  const [discountType, setDiscountType] = useState<string>(booking.discountType ?? "");
  const [discountValue, setDiscountValue] = useState<string>(booking.discountValue ? String(booking.discountValue) : "");
  const [inclusions, setInclusions] = useState<string[]>(booking.inclusions);
  const [inclusionInput, setInclusionInput] = useState("");
  const [locked, setLocked] = useState(booking.servicesLocked);
  const [savingMeta, startMeta] = useTransition();
  // Customer email — required before services can be locked (the invoice is sent
  // there). Pre-filled from the booking/customer/lead; can be added inline.
  const [email, setEmail] = useState<string>(
    booking.guestEmail ?? booking.customer?.email ?? booking.lead?.email ?? "",
  );
  // Lock flow dialog: "email" prompts for a missing email, "confirm" confirms the
  // lock. Replaces the old window.confirm() so we never use a browser alert.
  const [dialog, setDialog] = useState<null | "email" | "confirm">(null);
  const [savingEmail, startSaveEmail] = useTransition();

  // Amount actually in effect for a row: the live (blurred) value if present, else
  // the persisted amount. Drafts default to 0 until edited.
  const amountOf = (row: Service) =>
    liveAmounts[row.id] ?? row.amount;

  // Services as the finance calc sees them — persisted + drafts, with live amounts.
  const effectiveServices = useMemo(
    () => [...services, ...drafts].map((s) => ({ amount: amountOf(s) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services, drafts, liveAmounts],
  );

  const finance = useMemo(
    () =>
      computeBookingFinance({
        amount: booking.amount,
        discountType: discountType || null,
        discountValue: discountValue ? parseFloat(discountValue) : 0,
        payments,
        services: effectiveServices,
      }),
    [booking.amount, discountType, discountValue, payments, effectiveServices],
  );

  // Record a row's amount on blur so totals react immediately.
  function setLiveAmount(id: string, amount: number) {
    setLiveAmounts((prev) => (prev[id] === amount ? prev : { ...prev, [id]: amount }));
  }

  function capError(amount: number, excludeId: string | null): string | null {
    const others = [...services, ...drafts]
      .filter((s) => s.id !== excludeId)
      .reduce((t, s) => t + amountOf(s), 0);
    if (round2(others + amount) > booking.amount) {
      return `Services total would exceed the booking amount (${inr(booking.amount)}).`;
    }
    return null;
  }

  function addDraft(kind: Kind) {
    setDrafts((d) => [
      ...d,
      { id: `draft-${++draftSeq}`, kind, name: "", amount: 0, location: null, nights: null, pickup: null, dropoff: null, timing: null, sortOrder: services.length + d.length },
    ]);
  }

  // ── discount / inclusions persistence ──
  function saveBookingMeta(patch: Record<string, unknown>) {
    startMeta(async () => {
      try {
        const res = await fetch(`/api/bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(j.error ?? "Save failed.");
          return;
        }
        toast.success("Saved.");
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  function saveDiscount() {
    saveBookingMeta({ discountType: discountType || null, discountValue: discountValue ? parseFloat(discountValue) : 0 });
  }

  function addInclusion() {
    const v = inclusionInput.trim();
    if (!v) return;
    const next = [...inclusions, v];
    setInclusions(next);
    setInclusionInput("");
    saveBookingMeta({ inclusions: next });
  }
  function removeInclusion(i: number) {
    const next = inclusions.filter((_, idx) => idx !== i);
    setInclusions(next);
    saveBookingMeta({ inclusions: next });
  }

  // ── lock services ──
  const [locking, startLock] = useTransition();

  // Open the lock flow: block on an over-cap total, then route to the email prompt
  // (when no customer email yet) or straight to the confirm dialog.
  function openLock() {
    if (finance.servicesTotal > booking.amount) {
      toast.error(`Services total (${inr(finance.servicesTotal)}) exceeds the booking amount (${inr(booking.amount)}).`);
      return;
    }
    setDialog(email.trim() ? "confirm" : "email");
  }

  // Persist a newly entered customer email, then advance to the confirm step.
  function saveEmailAndContinue(value: string) {
    const next = value.trim();
    startSaveEmail(async () => {
      try {
        const res = await fetch(`/api/bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestEmail: next }),
        });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          toast.error(typeof j.error === "string" ? j.error : "Could not save the email.");
          return;
        }
        setEmail(next);
        toast.success("Customer email saved.");
        setDialog("confirm");
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  function performLock() {
    startLock(async () => {
      try {
        const res = await fetch(`/api/bookings/${booking.id}/lock-services`, { method: "POST" });
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; emailed?: boolean; error?: string; code?: string };
        if (!res.ok) {
          // Server is authoritative: if it still reports a missing email, route the
          // user back to the email prompt instead of just showing a toast.
          if (j.code === "EMAIL_REQUIRED") {
            toast.error(j.error ?? "A customer email is required.");
            setDialog("email");
            return;
          }
          toast.error(j.error ?? "Failed to lock services.");
          return;
        }
        setLocked(true);
        setDialog(null);
        toast.success(j.emailed ? "Services locked. Summary emailed to customer." : "Services locked.");
        router.refresh();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Booking Services</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Ref {booking.id.slice(-8).toUpperCase()}</p>
        </div>
        {locked && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Lock className="w-4 h-4" /> Services locked
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-xs">
          <Detail label="Customer" value={booking.lead?.name ?? booking.customer?.name ?? booking.guestName} sub={booking.lead?.phone ?? booking.guestPhone} />
          <Detail label="Email" value={email || "Not provided"} />
          <Detail label="Source" value={booking.lead ? "Converted lead" : booking.tourTitle ? "Website booking" : "Direct booking"} sub={booking.lead?.assignedTo ? `Sales: ${booking.lead.assignedTo.name ?? booking.lead.assignedTo.email}` : booking.tourTitle ?? undefined} />
          <Detail label="Booking Amount" value={inr(finance.bookingAmount)} strong />
          <Detail label="Paid Amount" value={inr(finance.paidAmount)} strong />
          <Detail label="Balance" value={inr(finance.balance)} strong />
        </div>

        {/* Email is mandatory to lock services (invoice destination). */}
        {!email.trim() && !locked && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-amber-700 dark:text-amber-300">Customer email required</p>
              <p className="text-muted-foreground mt-0.5">Add a customer email before locking services — the invoice is emailed to the customer.</p>
            </div>
            <button
              onClick={() => setDialog("email")}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg"
            >
              <Mail className="w-3.5 h-3.5" /> Add Email
            </button>
          </div>
        )}
      </div>

      {/* Service sections */}
      {SECTIONS.map((section) => {
        const persisted = services.filter((s) => s.kind === section.kind);
        const sectionDrafts = drafts.filter((s) => s.kind === section.kind);
        const sectionTotal = [...persisted, ...sectionDrafts].reduce((t, s) => t + amountOf(s), 0);
        const Icon = section.icon;
        return (
          <div key={section.kind} className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2"><Icon className="w-4 h-4" /> {section.title}</h3>
              <span className="text-xs text-muted-foreground">Total: <span className="font-bold text-foreground">{inr(sectionTotal)}</span></span>
            </div>

            <div className="space-y-2">
              {persisted.length === 0 && sectionDrafts.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No {section.title.toLowerCase()} added.</p>
              )}
              {persisted.map((svc) => (
                <ServiceRow
                  key={svc.id}
                  bookingId={booking.id}
                  record={svc}
                  fields={section.fields}
                  locked={locked}
                  capError={capError}
                  onAmountBlur={setLiveAmount}
                  onSaved={(s) => setServices((prev) => prev.map((x) => (x.id === s.id ? s : x)))}
                  onRemoved={() => setServices((prev) => prev.filter((x) => x.id !== svc.id))}
                />
              ))}
              {sectionDrafts.map((svc) => (
                <ServiceRow
                  key={svc.id}
                  bookingId={booking.id}
                  record={svc}
                  isDraft
                  fields={section.fields}
                  locked={locked}
                  capError={capError}
                  onAmountBlur={setLiveAmount}
                  onSaved={(s) => {
                    setDrafts((prev) => prev.filter((x) => x.id !== svc.id));
                    setServices((prev) => [...prev, s]);
                    // Carry the live amount over to the new persisted row id.
                    setLiveAmounts((prev) => ({ ...prev, [s.id]: s.amount }));
                  }}
                  onRemoved={() => setDrafts((prev) => prev.filter((x) => x.id !== svc.id))}
                />
              ))}
            </div>

            {!locked && (
              <button
                onClick={() => addDraft(section.kind)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary border border-dashed border-primary/40 px-3 py-1.5 rounded-lg hover:bg-primary/10"
              >
                <Plus className="w-3.5 h-3.5" /> {section.addLabel}
              </button>
            )}
          </div>
        );
      })}

      {/* Inclusions */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <h3 className="font-bold text-foreground text-sm mb-3">Inclusions</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {inclusions.length === 0 && <p className="text-xs text-muted-foreground">No inclusions added.</p>}
          {inclusions.map((inc, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-full">
              {inc}
              {!locked && (
                <button onClick={() => removeInclusion(i)} className="text-muted-foreground hover:text-red-500"><X className="w-3 h-3" /></button>
              )}
            </span>
          ))}
        </div>
        {!locked && (
          <div className="flex gap-2">
            <input
              value={inclusionInput}
              onChange={(e) => setInclusionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInclusion(); } }}
              placeholder="e.g. Meals, Cab, Sightseeing…"
              className={inputCls}
            />
            <button onClick={addInclusion} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-primary border border-border px-3 py-1.5 rounded-lg hover:bg-primary/10">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        )}
      </div>

      {/* Discount + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-bold text-foreground text-sm mb-3">Discount</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-muted-foreground">Type</span>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} disabled={locked} className={`${inputCls} mt-1`}>
                <option value="">None</option>
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENT">Percent (%)</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-muted-foreground">Value</span>
              <input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} disabled={locked || !discountType} className={`${inputCls} mt-1`} />
            </label>
          </div>
          {!locked && (
            <button onClick={saveDiscount} disabled={savingMeta} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50">
              {savingMeta && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Discount
            </button>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          <h3 className="font-bold text-foreground text-sm mb-3">Price Summary</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Total Booking Amount" value={inr(finance.bookingAmount)} />
            <Row label="Services Total" value={inr(finance.servicesTotal)} muted />
            <Row label="Discount" value={`– ${inr(finance.discountAmount)}`} />
            <Row label="Effective Payable" value={inr(finance.effectivePayable)} strong />
            <Row label="Paid Amount" value={inr(finance.paidAmount)} />
            <div className="border-t border-border pt-1.5 mt-1.5">
              <Row label="Net Balance" value={inr(finance.balance)} strong />
            </div>
          </dl>
          {finance.servicesTotal > booking.amount && (
            <p className="mt-2 text-[11px] text-red-500 dark:text-red-400">Services total exceeds the booking amount.</p>
          )}
        </div>
      </div>

      {/* Payments ledger */}
      <PaymentsCard bookingId={booking.id} payments={payments} onAdded={(p) => setPayments((prev) => [...prev, p])} />

      {/* Lock CTA */}
      {!locked ? (
        <div className="flex justify-end">
          <button
            onClick={openLock}
            disabled={locking}
            className="inline-flex items-center gap-2 text-sm font-bold bg-amber-600 text-white px-5 py-2.5 rounded-xl hover:bg-amber-700 disabled:opacity-50"
          >
            {locking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Lock Services &amp; Email Summary
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 justify-end text-xs text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> Services are locked. A summary was emailed to the customer.
        </div>
      )}

      {dialog && (
        <LockDialog
          mode={dialog}
          initialEmail={email}
          customerName={booking.lead?.name ?? booking.customer?.name ?? booking.guestName}
          savingEmail={savingEmail}
          locking={locking}
          onClose={() => setDialog(null)}
          onSaveEmail={saveEmailAndContinue}
          onConfirm={performLock}
        />
      )}
    </div>
  );
}

/**
 * Two-step lock dialog (replaces window.confirm):
 *  - "email":   the booking has no customer email yet — collect one before locking.
 *  - "confirm": email present — confirm the irreversible lock + invoice send.
 */
function LockDialog({
  mode,
  initialEmail,
  customerName,
  savingEmail,
  locking,
  onClose,
  onSaveEmail,
  onConfirm,
}: {
  mode: "email" | "confirm";
  initialEmail: string;
  customerName: string;
  savingEmail: boolean;
  locking: boolean;
  onClose: () => void;
  onSaveEmail: (email: string) => void;
  onConfirm: () => void;
}) {
  const [value, setValue] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    onSaveEmail(v);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl p-5 space-y-4"
      >
        {mode === "email" ? (
          <form onSubmit={submitEmail} className="space-y-4">
            <div>
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Customer email required
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                The booking invoice is emailed to the customer, so a valid email is required before locking services. Add an email for{" "}
                <span className="font-semibold text-foreground">{customerName}</span>.
              </p>
            </div>
            <label className="block">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Customer Email</span>
              <input
                type="email"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="customer@example.com"
                className={`${inputCls} mt-1`}
                autoFocus
              />
            </label>
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted">
                Cancel
              </button>
              <button type="submit" disabled={savingEmail} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                {savingEmail && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save &amp; Continue
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Lock services?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Services can no longer be edited and a booking summary will be emailed to{" "}
                <span className="font-semibold text-foreground">{initialEmail}</span>. This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-semibold rounded-xl border border-border text-foreground hover:bg-muted">
                Cancel
              </button>
              <button type="button" onClick={onConfirm} disabled={locking} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50">
                {locking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Lock &amp; Email Summary
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, sub, strong }: { label: string; value: string; sub?: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className={cn("text-foreground", strong ? "font-bold text-sm" : "font-semibold")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
    </div>
  );
}

function Row({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn("text-muted-foreground", muted && "text-[11px]")}>{label}</dt>
      <dd className={cn("text-foreground", strong ? "font-extrabold" : "font-semibold")}>{value}</dd>
    </div>
  );
}

interface RowForm { name: string; location: string; nights: string; pickup: string; dropoff: string; timing: string; amount: string; }

function ServiceRow({
  bookingId,
  record,
  isDraft = false,
  fields,
  locked,
  capError,
  onAmountBlur,
  onSaved,
  onRemoved,
}: {
  bookingId: string;
  record: Service;
  isDraft?: boolean;
  fields: FieldDef[];
  locked: boolean;
  capError: (amount: number, excludeId: string | null) => string | null;
  onAmountBlur: (id: string, amount: number) => void;
  onSaved: (s: Service) => void;
  onRemoved: () => void;
}) {
  const [form, setForm] = useState<RowForm>({
    name: record.name,
    location: record.location ?? "",
    nights: record.nights != null ? String(record.nights) : "",
    pickup: record.pickup ?? "",
    dropoff: record.dropoff ?? "",
    timing: record.timing ?? "",
    amount: record.amount ? String(record.amount) : "",
  });
  const [pending, start] = useTransition();

  function save() {
    if (!form.name.trim()) return toast.error("Name is required.");
    const amount = form.amount ? parseFloat(form.amount) : 0;
    const err = capError(amount, record.id);
    if (err) return toast.error(err);
    const payload = {
      kind: record.kind,
      name: form.name.trim(),
      amount,
      location: form.location.trim() || null,
      nights: form.nights === "" ? null : parseInt(form.nights, 10),
      pickup: form.pickup.trim() || null,
      dropoff: form.dropoff.trim() || null,
      timing: form.timing.trim() || null,
      sortOrder: record.sortOrder,
    };
    start(async () => {
      try {
        const res = await fetch(
          isDraft ? `/api/bookings/${bookingId}/services` : `/api/bookings/${bookingId}/services/${record.id}`,
          { method: isDraft ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
        );
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error((j as { error?: string }).error ?? "Save failed.");
          return;
        }
        toast.success("Saved.");
        onSaved(j as Service);
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  function remove() {
    if (isDraft) return onRemoved();
    start(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/services/${record.id}`, { method: "DELETE" });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(j.error ?? "Delete failed.");
          return;
        }
        onRemoved();
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2.5">
      {fields.map((f) => (
        <label key={f.key} className={cn("block", f.key === "amount" || f.key === "nights" ? "w-24" : "flex-1 min-w-[120px]")}>
          <span className="text-[10px] font-semibold text-muted-foreground">{f.label}</span>
          <input
            type={f.type}
            value={form[f.key]}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            onBlur={
              f.key === "amount"
                ? () => onAmountBlur(record.id, form.amount ? parseFloat(form.amount) || 0 : 0)
                : undefined
            }
            disabled={locked}
            className={`${inputCls} mt-0.5`}
          />
        </label>
      ))}
      {!locked && (
        <div className="flex items-center gap-1">
          <button onClick={save} disabled={pending} title="Save" className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          </button>
          <button onClick={remove} disabled={pending} title="Delete" className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentsCard({ bookingId, payments, onAdded }: { bookingId: string; payments: Payment[]; onAdded: (p: Payment) => void }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("PARTIAL");
  const [method, setMethod] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function add() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    start(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amt, type, method: method.trim() || null, note: note.trim() || null }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error((j as { error?: string }).error ?? "Failed to add payment.");
          return;
        }
        toast.success("Payment recorded.");
        onAdded(j as Payment);
        setAmount("");
        setMethod("");
        setNote("");
        setType("PARTIAL");
      } catch {
        toast.error("An error occurred.");
      }
    });
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
      <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2"><Wallet className="w-4 h-4" /> Payments</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="py-2 pr-3 font-bold">Type</th>
              <th className="py-2 pr-3 font-bold">Method</th>
              <th className="py-2 pr-3 font-bold">Note</th>
              <th className="py-2 pr-3 font-bold">Date</th>
              <th className="py-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No payments recorded.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-3"><span className="font-bold text-foreground">{p.type}</span></td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.method ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.note ?? "—"}</td>
                  <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</td>
                  <td className="py-2 text-right font-bold text-foreground">{inr(p.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <label className="w-28">
          <span className="text-[10px] font-semibold text-muted-foreground">Amount</span>
          <input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
        <label className="w-28">
          <span className="text-[10px] font-semibold text-muted-foreground">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} mt-0.5`}>
            <option value="TOKEN">Token</option>
            <option value="PARTIAL">Partial</option>
            <option value="FINAL">Final</option>
            <option value="REFUND">Refund</option>
          </select>
        </label>
        <label className="w-28">
          <span className="text-[10px] font-semibold text-muted-foreground">Method</span>
          <input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="cash/upi…" className={`${inputCls} mt-0.5`} />
        </label>
        <label className="flex-1 min-w-[120px]">
          <span className="text-[10px] font-semibold text-muted-foreground">Note</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={`${inputCls} mt-0.5`} />
        </label>
        <button onClick={add} disabled={pending} className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 disabled:opacity-50">
          {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Payment
        </button>
      </div>
    </div>
  );
}
