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
  Loader2,
  ShieldCheck,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Razorpay window type ────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open(): void };
  }
}

// ── Schema ──────────────────────────────────────────────────────────────────

const guestSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(8, "Valid phone number required"),
});
type GuestData = z.infer<typeof guestSchema>;

type Step = "idle" | "creating" | "paying" | "redirecting";

// ── Category label map ───────────────────────────────────────────────────────

const CAT: Record<string, string> = {
  HONEYMOON: "Honeymoon",
  FAMILY: "Family",
  ADVENTURE: "Adventure",
  LUXURY: "Luxury",
};

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYyNjVjIi8+PC9zdmc+";

// ── Props ───────────────────────────────────────────────────────────────────

export interface BookingFormProps {
  tourId: string;
  tourSlug?: string;
  tourTitle: string;
  tourCategory: string;
  priceFrom: number;
  duration: number;
  coverImage: string | null;
  initialDate: string;
  initialTravellers: number;
}

// ── Component ───────────────────────────────────────────────────────────────

export function BookingForm({
  tourId,
  tourTitle,
  tourCategory,
  priceFrom,
  duration,
  coverImage,
  initialDate,
  initialTravellers,
}: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [date, setDate] = useState(initialDate);
  const [travellers, setTravellers] = useState(String(initialTravellers || 2));

  const nights = duration - 1;
  const count = parseInt(travellers, 10) || 2;
  const total = priceFrom * count;
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<GuestData>({ resolver: zodResolver(guestSchema) });

  async function handlePay(data: GuestData) {
    if (!date) {
      toast.error("Please select a travel date.");
      return;
    }

    setStep("creating");

    let order: {
      orderId: string;
      amount: number;
      currency: string;
      bookingId: string;
      keyId: string;
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
          travelDate: date,
          travellers: count,
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
      description: tourTitle,
      image: "/brand/icon.png",
      order_id: order.orderId,
      prefill: { name, email, contact: phone },
      theme: { color: "#12783c" },
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
            if (result.success) {
              router.push(`/booking/success?bookingId=${bookingId}`);
            } else {
              router.push(`/booking/failed?bookingId=${bookingId}`);
            }
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
        : `Pay ₹${total.toLocaleString("en-IN")}`;

  return (
    <>
      {/* Load Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ── Left: Order summary ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tour card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
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
              <h3 className="font-display font-bold text-brand-navy text-base leading-snug mb-3">
                {tourTitle}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="font-medium text-brand-navy">
                    {duration}D · {nights}N
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Travel Date</dt>
                  <dd className="font-medium text-brand-navy">
                    {date
                      ? new Date(date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Travellers</dt>
                  <dd className="font-medium text-brand-navy">{count}</dd>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
                  <dt className="text-gray-500">Per person</dt>
                  <dd className="font-medium text-brand-navy">
                    ₹{priceFrom.toLocaleString("en-IN")}
                  </dd>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <dt className="text-brand-navy">Total</dt>
                  <dd className="text-brand-green">₹{total.toLocaleString("en-IN")}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Trust signals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            {[
              { Icon: ShieldCheck, text: "100% secure payment via Razorpay" },
              { Icon: BadgeCheck, text: "Best price guarantee — we match any lower rate" },
              { Icon: Lock, text: "Your data is encrypted and never shared" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-gray-600">
                <Icon className="w-3.5 h-3.5 text-brand-green shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Guest form ───────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="font-display font-bold text-brand-navy text-xl mb-6">
              Your Details
            </h2>

            <form onSubmit={handleSubmit(handlePay)} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="bf-name"
                  className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="bf-name"
                    type="text"
                    {...register("name")}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="bf-email"
                  className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="bf-email"
                    type="email"
                    {...register("email")}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="bf-phone"
                  className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                >
                  Phone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="bf-phone"
                    type="tel"
                    {...register("phone")}
                    placeholder="+91 98000 00000"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition"
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Date + Travellers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="bf-date"
                    className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                  >
                    Travel Date
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="bf-date"
                      type="date"
                      value={date}
                      min={today}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-2 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition [color-scheme:light]"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="bf-travellers"
                    className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                  >
                    Travellers
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      id="bf-travellers"
                      value={travellers}
                      onChange={(e) => setTravellers(e.target.value)}
                      className="w-full pl-9 pr-2 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition appearance-none bg-white"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Total + CTA */}
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    ₹{priceFrom.toLocaleString("en-IN")} × {count} person
                    {count !== 1 ? "s" : ""}
                  </span>
                  <span className="font-display font-bold text-brand-navy text-xl">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isPending}
                  size="lg"
                  className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold text-base shadow-lg shadow-brand-green/25 hover:scale-[1.02] active:scale-100 transition-all"
                >
                  {(step === "creating" || step === "redirecting") && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {buttonLabel}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  <Lock className="w-3 h-3 inline mr-1" />
                  Secured by Razorpay · UPI · Cards · Net Banking
                </p>
              </div>
            </form>
          </div>

          {/* Help */}
          <p className="text-center text-sm text-gray-500 mt-4">
            Need help?{" "}
            <a
              href={`https://wa.me/919419000000?text=${encodeURIComponent("Hi! I need help with my booking for " + tourTitle)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-green font-semibold hover:underline"
            >
              WhatsApp us
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
