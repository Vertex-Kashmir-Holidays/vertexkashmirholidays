"use client";

import { useState } from "react";
import Script from "next/script";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  Users,
  MapPin,
  MessageSquare,
  Loader2,
  ShieldCheck,
  BadgeCheck,
  Lock,
  Check,
  Wallet,
  CreditCard,
  Star,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVANCE_PERCENT, computeChargeable, type PaymentOption } from "@/lib/bookings/finance";
import { readAttributionClient } from "@/lib/attribution";

// ── Razorpay window type ────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void };
  }
}

// ── Schema (client validation; the server re-validates authoritatively) ──────

const guestSchema = z.object({
  name: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Valid email required"),
  phone: z.string().trim().min(8, "Valid phone number required"),
  address: z.string().trim().max(300).optional(),
  requirements: z.string().trim().max(1000).optional(),
});
type GuestData = z.infer<typeof guestSchema>;

type Step = "idle" | "creating" | "paying" | "redirecting";

const CAT: Record<string, string> = {
  HONEYMOON: "Honeymoon",
  FAMILY: "Family",
  ADVENTURE: "Adventure",
  LUXURY: "Luxury",
};

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYyNjVjIi8+PC9zdmc+";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const MIN_LEAD_DAYS = 4;
const MAX_BOOKING_MONTHS = 6;

// ── Props ───────────────────────────────────────────────────────────────────

export interface BookingFormProps {
  tourId: string;
  tourSlug?: string;
  tourTitle: string;
  tourCategory: string;
  priceFrom: number;
  duration: number;
  minPersons?: number;
  coverImage: string | null;
  rating?: number;
  reviewCount?: number;
  /** Nearest applicable departure's status/seats, when real batch data exists. Only rendered when status is 'filling'. */
  departureStatus?: string | null;
  departureSeats?: number | null;
  initialDate: string;
  initialTravellers: number;
  earliestDateFromBooking?: string;
  whatsappNumber?: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
}

// ── Component ───────────────────────────────────────────────────────────────

export function BookingForm({
  tourId,
  tourTitle,
  tourCategory,
  priceFrom,
  duration,
  minPersons = 1,
  coverImage,
  rating = 0,
  reviewCount = 0,
  departureStatus = null,
  departureSeats = null,
  initialDate,
  initialTravellers,
  earliestDateFromBooking,
  whatsappNumber = "919419000000",
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [date, setDate] = useState(initialDate);
  const [travellers, setTravellers] = useState(String(Math.max(initialTravellers || 1, minPersons)));
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("ADVANCE");

  const nights = duration - 1;
  const count = parseInt(travellers, 10) || minPersons;

  const minBookingDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + MIN_LEAD_DAYS);
    const leadDate = d.toISOString().split("T")[0];
    // If customer has an active booking, floor is end-of-trip + 15 days
    return earliestDateFromBooking && earliestDateFromBooking > leadDate
      ? earliestDateFromBooking
      : leadDate;
  })();

  const maxBookingDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + MAX_BOOKING_MONTHS);
    return d.toISOString().split("T")[0];
  })();

  // All money is recomputed on the server; these are for display only.
  const total = priceFrom * count;
  const payable = computeChargeable(total, paymentOption);
  const remaining = Math.max(0, total - payable);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<GuestData>({
    resolver: zodResolver(guestSchema),
    defaultValues: { name: defaultName, email: defaultEmail, phone: defaultPhone },
  });

  async function handlePay(data: GuestData) {
    if (!date) {
      toast.error("Please select a travel date.");
      return;
    }
    if (date < minBookingDate) {
      toast.error(`Please choose a travel date on or after ${new Date(minBookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`);
      return;
    }
    if (date > maxBookingDate) {
      toast.error(`Travel date cannot be more than ${MAX_BOOKING_MONTHS} months from today.`);
      return;
    }

    setStep("creating");

    let order: {
      orderId: string;
      amount: number;
      currency: string;
      bookingId: string;
      keyId: string;
      chargeable: number;
    };

    try {
      const res = await fetch("/api/bookings/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId,
          guestName: data.name,
          guestEmail: data.email,
          guestPhone: data.phone,
          address: data.address || undefined,
          requirements: data.requirements || undefined,
          travelDate: date,
          travellers: count,
          paymentOption,
          attribution: readAttributionClient(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error((json as { error?: string }).error ?? "Failed to create order");
      }
      order = json as typeof order;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create order");
      setStep("idle");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Payment gateway not loaded. Please refresh and try again.");
      setStep("idle");
      return;
    }

    const { name, email, phone } = getValues();
    const bookingId = order.bookingId;

    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Vertex Kashmir Holidays",
      description: `${tourTitle} — ${paymentOption === "ADVANCE" ? `${ADVANCE_PERCENT}% advance` : "full payment"}`,
      image: "/brand/png/icon/vertex-icon-512.png",
      order_id: order.orderId,
      prefill: { name, email, contact: phone },
      theme: { color: "#0BA45B" },
      modal: {
        ondismiss() {
          setStep("idle");
        },
      },
      handler(response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        setStep("redirecting");
        fetch("/api/bookings/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        })
          .then((r) => r.json())
          .then((result: { success: boolean }) => {
            router.push(
              result.success
                ? `/booking/success?bookingId=${bookingId}`
                : `/booking/failed?bookingId=${bookingId}`,
            );
          })
          .catch(() => {
            router.push(`/booking/failed?bookingId=${bookingId}`);
          });
      },
    });

    setStep("paying");
    rzp.open();
  }

  const isPending = step !== "idle";
  const buttonLabel =
    step === "creating"
      ? "Creating order…"
      : step === "redirecting"
        ? "Confirming payment…"
        : `Pay ${inr(payable)}`;

  const inputClass =
    "w-full pl-9 pr-3 py-2.5 text-sm bg-card text-foreground border border-border rounded-xl outline-none transition placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: summary ───────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border">
            <div className="relative aspect-video">
              <Image
                src={coverImage ?? PLACEHOLDER}
                alt={tourTitle}
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {CAT[tourCategory] ?? tourCategory}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display font-bold text-foreground text-base leading-snug mb-2">
                {tourTitle}
              </h3>
              {rating > 0 && reviewCount > 0 && (
                <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-400" fill="currentColor" strokeWidth={0} />
                  {rating.toFixed(1)}
                  <span className="font-normal">· {reviewCount.toLocaleString("en-IN")} reviews</span>
                </p>
              )}
              {departureStatus === "filling" && departureSeats != null && departureSeats > 0 && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-orange-500/10 px-3 py-2 text-orange-700 dark:text-orange-400">
                  <Flame className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                  <p className="text-xs font-semibold leading-snug">
                    Filling fast — only {departureSeats} seats left for this date
                  </p>
                </div>
              )}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium text-foreground">{duration}D · {nights}N</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Travel Date</dt>
                  <dd className="font-medium text-foreground">
                    {date
                      ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Travellers</dt>
                  <dd className="font-medium text-foreground">{count}</dd>
                </div>
              </dl>

              {/* Booking summary */}
              <div className="mt-4 border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Tour Cost <span className="text-xs">({inr(priceFrom)} × {count})</span>
                  </dt>
                  <dd className="font-medium text-foreground">{inr(total)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Taxes</dt>
                  <dd className="font-medium text-foreground">Inclusive</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <dt className="text-foreground">Payable Now</dt>
                  <dd className="text-primary">{inr(payable)}</dd>
                </div>
                {remaining > 0 && (
                  <div className="flex justify-between text-xs">
                    <dt className="text-muted-foreground">Remaining Balance (later)</dt>
                    <dd className="font-semibold text-foreground">{inr(remaining)}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trust */}
          <div className="bg-muted rounded-xl p-4 space-y-2.5">
            {[
              { Icon: ShieldCheck, text: "100% secure payment via Razorpay" },
              { Icon: BadgeCheck, text: "Transparent pricing — no hidden charges" },
              { Icon: Lock, text: "Your data is encrypted and never shared" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                {text}
              </div>
            ))}
            {/* Theme-matched pair, same block/hidden dark: pattern as <Logo variant="auto">.
                The inactive variant is display:none from first paint, so the
                browser never fetches it unless the theme is toggled live;
                neither carries `priority` since this is below-the-fold. */}
            <Image
              src="/gateway/payment-partner-light.webp"
              alt="Payment processing partner — Razorpay, and accepted cards/wallets"
              width={1536}
              height={1024}
              className="block h-24 w-full object-contain dark:hidden sm:h-28"
            />
            <Image
              src="/gateway/payment-partner-dark.webp"
              alt="Payment processing partner — Razorpay, and accepted cards/wallets"
              width={1536}
              height={1024}
              className="hidden h-24 w-full object-contain dark:block sm:h-28"
            />
          </div>
        </div>

        {/* ── Right: form ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
            <h2 className="font-display font-bold text-foreground text-xl mb-6">Your Details</h2>

            <form onSubmit={handleSubmit(handlePay)} className="space-y-5">
              {/* Name */}
              <Field label="Full Name" htmlFor="bf-name" error={errors.name?.message}>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input id="bf-name" type="text" {...register("name")} placeholder="e.g. Priya Sharma" className={inputClass} />
              </Field>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email Address" htmlFor="bf-email" error={errors.email?.message}>
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input id="bf-email" type="email" {...register("email")} placeholder="you@example.com" className={inputClass} />
                </Field>
                <Field label="Phone / WhatsApp" htmlFor="bf-phone" error={errors.phone?.message}>
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input id="bf-phone" type="tel" {...register("phone")} placeholder="+91 98000 00000" className={inputClass} />
                </Field>
              </div>

              {/* Address */}
              <Field label="Billing Address (optional)" htmlFor="bf-address">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input id="bf-address" type="text" {...register("address")} placeholder="City, State, PIN" className={inputClass} />
              </Field>

              {/* Date + Travellers */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Travel Date" htmlFor="bf-date">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="bf-date"
                    type="date"
                    value={date}
                    min={minBookingDate}
                    max={maxBookingDate}
                    onChange={(e) => setDate(e.target.value)}
                    className={`${inputClass} pr-2 [color-scheme:light] dark:[color-scheme:dark]`}
                  />
                </Field>
                <Field label={`Travellers${minPersons > 1 ? ` (min. ${minPersons})` : ""}`} htmlFor="bf-travellers">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                    id="bf-travellers"
                    value={travellers}
                    onChange={(e) => setTravellers(e.target.value)}
                    className={`${inputClass} pr-2 appearance-none`}
                  >
                    {Array.from({ length: 20 - minPersons + 1 }, (_, i) => i + minPersons).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Custom requirements */}
              <Field label="Custom Requirements (optional)" htmlFor="bf-req">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <textarea
                  id="bf-req"
                  rows={3}
                  {...register("requirements")}
                  placeholder="Anything special — hotel preferences, dietary needs, occasions…"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              {/* Payment options */}
              <div>
                <p className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Payment Option
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PaymentChoice
                    selected={paymentOption === "ADVANCE"}
                    onClick={() => setPaymentOption("ADVANCE")}
                    Icon={Wallet}
                    title={`Pay ${ADVANCE_PERCENT}% Advance`}
                    amount={inr(computeChargeable(total, "ADVANCE"))}
                    sub={`Balance ${inr(Math.max(0, total - computeChargeable(total, "ADVANCE")))} later`}
                  />
                  <PaymentChoice
                    selected={paymentOption === "FULL"}
                    onClick={() => setPaymentOption("FULL")}
                    Icon={CreditCard}
                    title="Pay Full Amount"
                    amount={inr(total)}
                    sub="Nothing left to pay"
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="border-t border-border pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {paymentOption === "ADVANCE" ? `${ADVANCE_PERCENT}% advance` : "Full payment"}
                  </span>
                  <span className="font-display font-bold text-foreground text-xl">{inr(payable)}</span>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-100 transition-all"
                >
                  {(step === "creating" || step === "redirecting") && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {buttonLabel}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Secured by Razorpay · UPI · Cards · Net Banking
                </p>
              </div>
            </form>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Need help?{" "}
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I need help with my booking for " + tourTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              WhatsApp us
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">{children}</div>
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

function PaymentChoice({
  selected,
  onClick,
  Icon,
  title,
  amount,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  Icon: typeof Wallet;
  title: string;
  amount: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      {selected && (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}
      <Icon className={`h-5 w-5 ${selected ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2} />
      <span className="text-[14px] font-bold text-foreground">{title}</span>
      <span className="text-[18px] font-extrabold text-primary">{amount}</span>
      <span className="text-[12px] text-muted-foreground">{sub}</span>
    </button>
  );
}
