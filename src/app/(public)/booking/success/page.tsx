import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Mail,
  FileText,
  Share2,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { BookingCompletedEvent } from "@/components/booking/BookingCompletedEvent";

export const metadata: Metadata = {
  title: "Booking Confirmed! — Vertex Kashmir Holidays",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMGYyNjVjIi8+PC9zdmc+";

function formatRef(id: string) {
  return `VKH${new Date().getFullYear()}-${id.slice(3, 11).toUpperCase()}`;
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { bookingId } = await searchParams;

  // Never let a transient DB outage crash the result page — degrade gracefully.
  const [booking, settings] = await Promise.all([
    bookingId
      ? prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            tour: {
              select: {
                title: true,
                slug: true,
                coverImage: true,
                duration: true,
                category: true,
              },
            },
          },
        })
      : null,
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
  ]).catch((err) => {
    console.error("[booking/success] data load failed", err);
    return [null, null] as [null, null];
  });

  const ref = booking ? formatRef(booking.id) : "VKH-CONFIRMED";
  const nights = booking?.tour ? booking.tour.duration - 1 : 0;
  const whatsappNumber = (settings?.whatsapp ?? settings?.sitePhone ?? "919419000000").replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hi! I just booked "${booking?.tour?.title ?? "a trip"}" with Vertex Kashmir Holidays. Booking ref: ${ref}`,
  );

  const NEXT_STEPS = [
    {
      step: "01",
      title: "Confirmation email sent",
      body: "Check your inbox — we've sent the full booking summary to your email.",
    },
    {
      step: "02",
      title: "Personalised itinerary in 24 hrs",
      body: "Our team will email your day-by-day itinerary and hotel details within 24 hours.",
    },
    {
      step: "03",
      title: "WhatsApp intro from your guide",
      body: "Your dedicated Kashmir guide will WhatsApp you 48 hours before departure.",
    },
  ];

  const ACTIONS = [
    { Icon: Mail, label: "Confirmation Email", sub: "Sent to your inbox", href: null as string | null },
    { Icon: FileText, label: "Trip Documents", sub: "Ready in 24 hrs", href: null as string | null },
    {
      Icon: ({ className }: { className?: string }) => (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      label: "WhatsApp Support",
      sub: "Chat with our team",
      href: `https://wa.me/${whatsappNumber}?text=${waText}`,
    },
    { Icon: Share2, label: "Share Your Trip", sub: "Tell your friends", href: null as string | null },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      {booking && (
        <BookingCompletedEvent
          bookingId={booking.id}
          value={booking.amount}
          packageName={booking.tour?.title ?? "Kashmir Tour"}
        />
      )}
      {/* ── Success banner ─────────────────────────────────────────────── */}
      <div className="bg-primary py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-primary-foreground" strokeWidth={1.5} />
          </div>
          <h1 className="font-display font-extrabold text-primary-foreground text-4xl sm:text-5xl mb-3">
            Booking Confirmed!
          </h1>
          {booking && (
            <p className="text-primary-foreground/80 text-lg">
              Thank you, {booking.guestName.split(" ")[0]}. Your Kashmir adventure is all set.
            </p>
          )}
          <div className="mt-4 inline-block bg-primary-foreground/20 border border-primary-foreground/30 text-primary-foreground text-sm font-mono font-bold px-5 py-2.5 rounded-full">
            Booking #{ref}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* ── Tour summary ──────────────────────────────────────────────── */}
        {booking && (
          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="flex gap-0 sm:gap-4">
              <div className="hidden sm:block relative w-48 shrink-0">
                <Image
                  src={booking.tour?.coverImage ?? PLACEHOLDER}
                  alt={booking.tour?.title ?? "Your trip"}
                  fill
                  sizes="192px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 p-6">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                  Trip Summary
                </p>
                <h2 className="font-display font-bold text-foreground text-xl mb-4">
                  {booking.tour?.title ?? "Your trip"}
                </h2>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Duration</dt>
                    <dd className="font-semibold text-foreground">
                      {booking.tour?.duration ?? "—"}D · {nights}N
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Travellers</dt>
                    <dd className="font-semibold text-foreground">{booking.travellers}</dd>
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
                    <dt className="text-muted-foreground text-xs">Amount Paid</dt>
                    <dd className="font-bold text-primary text-base">
                      ₹{booking.amount.toLocaleString("en-IN")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* ── Action cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ACTIONS.map(({ Icon, label, sub, href }) => {
            const inner = (
              <>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground">{sub}</p>
              </>
            );
            const cls =
              "bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col items-center text-center gap-2";
            return href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cls} hover:shadow-md transition-shadow`}
              >
                {inner}
              </a>
            ) : (
              <div key={label} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>

        {/* ── What happens next ─────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8">
          <h3 className="font-display font-bold text-foreground text-xl mb-6">
            What Happens Next?
          </h3>
          <div className="space-y-5">
            {NEXT_STEPS.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{s.step}</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm mb-0.5">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Link href="/tours">
              Explore More Packages
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Reference #{ref} · Confirmation sent to {booking?.guestEmail ?? "your email"}
          </p>
        </div>
      </div>
    </div>
  );
}
