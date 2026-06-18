import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, RefreshCcw, CreditCard, Headphones, ArrowRight, HelpCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Payment Failed — Vertex Kashmir Holidays",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

function formatRef(id: string) {
  return `VKH${new Date().getFullYear()}-${id.slice(3, 11).toUpperCase()}`;
}

const FAQS = [
  {
    q: "Will I be charged for this failed payment?",
    a: "No. Your payment was not captured. If any amount was temporarily held by your bank, it will be automatically released within 5–7 business days.",
  },
  {
    q: "What payment methods are available?",
    a: "Razorpay supports all major Indian payment methods: UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, Net Banking, and Wallets.",
  },
  {
    q: "Is my booking still saved?",
    a: "Yes — your booking details are saved. Use your booking reference to retry or contact our team for assistance.",
  },
];

export default async function BookingFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { bookingId } = await searchParams;

  const [booking, settings] = await Promise.all([
    bookingId
      ? prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            tour: {
              select: { title: true, slug: true, duration: true },
            },
          },
        })
      : null,
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ]);

  const ref = booking ? formatRef(booking.id) : null;
  const nights = booking?.tour ? booking.tour.duration - 1 : 0;
  const retryHref = booking?.tour
    ? `/booking?tour=${booking.tour.slug}&date=${booking.travelDate.toISOString().split("T")[0]}&travellers=${booking.travellers}`
    : "/tours";
  const whatsappNumber = (settings?.whatsapp ?? settings?.sitePhone ?? "919419000000").replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hi! My payment failed for "${booking?.tour?.title ?? "a Kashmir tour"}". Booking ref: ${ref ?? "N/A"}. Can you help?`,
  );

  const OPTIONS = [
    {
      Icon: RefreshCcw,
      label: "Try Again",
      sub: "Retry with the same details",
      href: retryHref,
      primary: true,
      external: false,
    },
    {
      Icon: CreditCard,
      label: "Try Another Method",
      sub: "Switch UPI / Card / Net Banking",
      href: retryHref,
      primary: false,
      external: false,
    },
    {
      Icon: Headphones,
      label: "Need Assistance?",
      sub: "WhatsApp our booking team",
      href: `https://wa.me/${whatsappNumber}?text=${waText}`,
      primary: false,
      external: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      {/* ── Failed banner ─────────────────────────────────────────────── */}
      <div className="border-b border-rose-500/20 bg-rose-500/10 py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-rose-500" strokeWidth={1.5} />
          </div>
          <h1 className="font-display font-extrabold text-rose-600 dark:text-rose-400 text-4xl sm:text-5xl mb-3">
            Oops! Payment Failed
          </h1>
          <p className="text-rose-600/80 dark:text-rose-300/80 text-lg">
            Don&apos;t worry — your booking details are saved. You can retry anytime or contact us for help.
          </p>
          {ref && (
            <div className="mt-4 inline-block bg-rose-500/15 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-sm font-mono font-bold px-5 py-2.5 rounded-full">
              Reference #{ref}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* ── Booking details ───────────────────────────────────────────── */}
        {booking && (
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h2 className="font-display font-semibold text-foreground text-lg mb-4">
              Booking Details
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Tour</dt>
                <dd className="font-semibold text-foreground">{booking.tour?.title ?? "Custom booking"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Duration</dt>
                <dd className="font-semibold text-foreground">
                  {booking.tour?.duration ?? "—"}D · {nights}N
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Travel Date</dt>
                <dd className="font-semibold text-foreground">
                  {booking.travelDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Travellers</dt>
                <dd className="font-semibold text-foreground">{booking.travellers}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Amount</dt>
                <dd className="font-bold text-foreground text-base">
                  ₹{booking.amount.toLocaleString("en-IN")}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Status</dt>
                <dd className="font-semibold text-rose-500">Payment Failed</dd>
              </div>
            </dl>
          </div>
        )}

        {/* ── Option cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {OPTIONS.map(({ Icon, label, sub, href, primary, external }) => (
            <Link
              key={label}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className={`rounded-2xl border p-5 flex flex-col items-center text-center gap-3 transition-all hover:shadow-md ${
                primary
                  ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-card border-border hover:border-foreground/20"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  primary ? "bg-primary-foreground/20" : "bg-muted"
                }`}
              >
                <Icon className={`w-5 h-5 ${primary ? "text-primary-foreground" : "text-foreground"}`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${primary ? "text-primary-foreground" : "text-foreground"}`}>
                  {label}
                </p>
                <p className={`text-xs mt-0.5 ${primary ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {sub}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <h3 className="font-display font-bold text-foreground text-lg mb-5 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </h3>
          <div className="space-y-5">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <p className="font-semibold text-foreground text-sm mb-1">{faq.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Still planning CTA ───────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            ● Still planning your trip?
          </p>
          <h3 className="font-display font-bold text-foreground text-xl mb-3">
            Explore all Kashmir packages
          </h3>
          <p className="text-muted-foreground text-sm mb-6">
            Browse our full collection of honeymoon, family, adventure &amp; luxury tours.
          </p>
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/25"
          >
            <Link href="/tours">
              Browse Packages
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
