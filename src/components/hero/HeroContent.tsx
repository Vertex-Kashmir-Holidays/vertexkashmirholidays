"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";
import { EASE_BRAND } from "@/lib/motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { imgSrc } from "@/lib/placeholder";
import {
  ArrowRight,
  Phone,
  User,
  Users,
  Calendar,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/atoms/button";

// ─── Inquiry form schema ───────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  travelDate: z.string().optional(),
  // native <select> always produces a string; convert to number in onSubmit
  travellers: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

// ─── Stats ────────────────────────────────────────────────────────────────────
const STATS = [
  { value: "12,000+", label: "Happy Travellers" },
  { value: "500+", label: "Curated Trips" },
  { value: "15+", label: "Years on Ground" },
  { value: "4.9/5", label: "Average Rating" },
];

type HeroContentProps = {
  /** Optional mouse-driven motion value for the inquiry card's subtle tilt (HeroParallax). */
  cardTilt?: MotionValue<number>;
};

// ─── Shared hero content — headline, CTAs, inquiry card, stats strip ─────────
// Reused by HeroParallax and HeroR3F so the copy/form/animation only lives once.
export function HeroContent({ cardTilt }: HeroContentProps) {
  return (
    <>
      {/* ── CONTENT ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 w-full">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-center">
            {/* Headline column */}
            <div>
              {/* Pill badge */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-4 py-1.5 mb-8"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-green" />
                </span>
                <span className="text-[12px] font-semibold text-brand-green tracking-[0.18em] uppercase">
                  Monsoon Ready Kashmir Trips · 2026
                </span>
              </motion.div>

              {/* H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: EASE_BRAND }}
                className="h-display text-5xl sm:text-6xl xl:text-[4.25rem] font-extrabold text-white mb-6"
              >
                While the plains <span className="grad-orange">scorch,</span>
                <br className="hidden sm:block" /> Kashmir is{" "}
                <span className="grad-cyan">calling.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.32 }}
                className="text-lg text-white/60 leading-relaxed mb-10 max-w-[480px]"
              >
                Curated Kashmir holidays crafted by locals — houseboat stays, meadow treks, shikara
                sunsets. Priced for honest travellers.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.42 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-brand-green hover:bg-brand-green/90 text-white font-semibold shadow-lg shadow-brand-green/20 hover:scale-105 transition-all duration-200"
                >
                  <Link href="/tours">
                    Explore Packages
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent hover:scale-105 transition-all duration-200"
                >
                  <a href="https://wa.me/919419000000" target="_blank" rel="noopener noreferrer">
                    <Phone className="mr-2 h-4 w-4" />
                    Talk to Expert
                  </a>
                </Button>
              </motion.div>
            </div>

            {/* Inquiry card column */}
            <motion.div
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.28, ease: EASE_BRAND }}
              style={cardTilt ? { x: cardTilt } : undefined}
              className="will-change-transform"
            >
              <InquiryCard />
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.58 }}
        className="relative z-10 border-t border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white font-mono leading-none mb-0.5">
                  {s.value}
                </p>
                <p className="text-[12px] text-white/60 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Glass inquiry card ───────────────────────────────────────────────────────
function InquiryCard() {
  const [sent, setSent] = useState(false);
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    try {
      // Build payload — only include optional fields when non-empty
      const payload: Record<string, unknown> = {
        name: data.name,
        phone: data.phone,
        source: "hero",
      };
      if (data.travelDate) payload.travelDate = data.travelDate;
      if (data.travellers && data.travellers !== "")
        payload.travellers = parseInt(data.travellers, 10);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      toast.success("We'll call you back within 60 minutes!", {
        description: "Our Kashmir travel experts are ready to plan your trip.",
      });
      setSent(true);
      reset();
      setTimeout(() => setSent(false), 6000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto lg:mx-0 lg:ml-auto">
      {/* Background photo */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={imgSrc()}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 480px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30" />
      </div>

      <div className="relative p-6 sm:p-8">
        {/* Card header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/10 px-3 py-1 mb-4">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-green" />
            </span>
            <span className="text-[12px] font-semibold text-brand-green tracking-[0.18em] uppercase">
              Plan Your Kashmir Trip
            </span>
          </div>
          <h2 className="text-white font-bold text-2xl mb-1 h-display">
            Get a quote in 60 seconds
          </h2>
          <p className="text-white/60 text-sm">Free, no spam – real human on WhatsApp.</p>
        </div>

        {sent ? (
          /* Success state */
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-brand-green" strokeWidth={2.5} />
            </div>
            <p className="text-white font-semibold text-lg mb-1">Request received!</p>
            <p className="text-white/50 text-sm">We&apos;ll call you back shortly.</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
            {/* Name */}
            <div>
              <label htmlFor="hero-name" className="sr-only">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  id="hero-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your Name"
                  className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2.5 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/40 transition"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="mt-1 ml-1 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="hero-phone" className="sr-only">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                <input
                  id="hero-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Phone Number"
                  className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2.5 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/40 transition"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 ml-1 text-xs text-red-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Date + Travellers row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Travel date */}
              <div>
                <label htmlFor="hero-date" className="sr-only">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                  <input
                    id="hero-date"
                    type="date"
                    min={minDate}
                    placeholder="Start Date"
                    className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-2 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/40 transition [color-scheme:dark]"
                    {...register("travelDate")}
                  />
                </div>
              </div>

              {/* Travellers */}
              <div>
                <label htmlFor="hero-travellers" className="sr-only">
                  Travellers
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
                  <select
                    id="hero-travellers"
                    className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-7 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/40 transition appearance-none [color-scheme:dark]"
                    {...register("travellers")}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Travellers
                    </option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "person" : "people"}
                      </option>
                    ))}
                    <option value="11">11+ people</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/35 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Sending…
                </span>
              ) : (
                "Request Itinerary →"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
