"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";
import { User, Mail, Loader2, Check, ArrowRight } from "lucide-react";
import type { CountryCode } from "libphonenumber-js";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { toE164 } from "@/lib/auth/validation";
import { HONEYPOT_FIELD, TIMETRAP_FIELD } from "@/lib/security/formGuard";
import {
  leadInputSchema,
  type LeadInput,
  type LeadContext,
  type LeadSourcePage,
} from "@/lib/leads/schema";
import { trackLeadSubmit } from "@/lib/analytics";

interface LeadFormProps {
  /** Distinct per-placement tag, stored on Lead.sourcePage for attribution. */
  source: LeadSourcePage;
  /** Optional page context (tour/destination being viewed). */
  context?: LeadContext;
  /** Optional DB-driven copy (home hero pulls these from HomeContent). */
  kicker?: string | null;
  title?: string | null;
  subtitle?: string | null;
  buttonLabel?: string | null;
  note?: string | null;
  avatars?: string[];
  /** Extra classes on the form wrapper. */
  className?: string;
}

// Match the country-aware PhoneInput (.input-wrap): solid card background,
// the same input border, and an identical primary focus ring — so Name, Email
// and Phone read as one consistent field set.
const inputBase =
  "w-full rounded-xl border border-input bg-card px-4 py-3 text-[14px] text-foreground placeholder-foreground/45 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

export function LeadForm({
  source,
  context,
  kicker,
  title,
  subtitle,
  buttonLabel,
  note,
  avatars = [],
  className,
}: LeadFormProps) {
  const [sent, setSent] = useState(false);
  const [sentName, setSentName] = useState("");
  // Phone is country-aware (reuses the create-account PhoneInput + toE164).
  const [country, setCountry] = useState<CountryCode>("IN");
  const [national, setNational] = useState("");

  // ── Anti-bot ───────────────────────────────────────────────────────────────
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef<number>(Date.now());

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    trigger,
    formState: { errors, isSubmitting, isValid },
    reset,
  } = useForm<LeadInput>({
    resolver: zodResolver(leadInputSchema),
    mode: "onChange",
    defaultValues: { name: "", phone: "", email: "", agree: false, source, context },
  });

  // Keep the E.164 string (what the schema validates) in sync with the
  // country + national-number UI.
  function syncPhone(nextNational: string, nextCountry: CountryCode) {
    setNational(nextNational);
    setCountry(nextCountry);
    const e164 = toE164(nextNational, nextCountry);
    setValue("phone", e164 ?? nextNational, { shouldValidate: true });
  }

  const onSubmit = async (data: LeadInput) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          agree: data.agree,
          source,
          context,
          // Anti-bot signals (honeypot must be empty; render time for time-trap).
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? "",
          [TIMETRAP_FIELD]: renderedAt.current,
          turnstileToken: captchaToken ?? undefined,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        blocked?: boolean;
        whatsapp?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      };

      if (!res.ok) {
        // Duplicate-block (409) comes with a friendly message + WhatsApp link.
        if (json.blocked && json.whatsapp) {
          const wa = json.whatsapp;
          toast.error(json.error || "Your query is already in progress.", {
            duration: 8000,
            action: { label: "WhatsApp", onClick: () => window.open(wa, "_blank") },
          });
          return;
        }
        // Validation failure → surface each issue inline on its field.
        if (json.fieldErrors) {
          for (const key of ["name", "phone", "email", "agree"] as const) {
            const msg = json.fieldErrors[key]?.[0];
            if (msg) setError(key, { type: "server", message: msg });
          }
          return;
        }
        toast.error(json.error || "Something went wrong. Please try again.");
        return;
      }

      setSentName(String(data.name).trim().split(/\s+/)[0] || "there");
      setSent(true);
      trackLeadSubmit(source === "tour-detail" ? "tour_inquiry" : source === "contact" ? "contact" : "itinerary");
      reset();
      setNational("");
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  if (sent) {
    return (
      <div className={className}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="py-6 text-center"
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <Check className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <p className="text-[17px] font-bold text-foreground">
            Thank you, {sentName}! 🌿
          </p>
          <p className="mx-auto mt-1.5 max-w-[16rem] text-[13px] leading-relaxed text-muted-foreground">
            Our local Kashmir expert will connect with you on WhatsApp shortly —
            usually within 30 minutes.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={className}>
      {kicker && (
        <p className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {kicker}
        </p>
      )}
      {title && (
        <h2 className="h-display mt-3 text-[24px] font-bold text-foreground">{title}</h2>
      )}
      {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-3">
        {/* Honeypot — off-screen, hidden from users + a11y tree; bots fill it. */}
        <input
          ref={honeypotRef}
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />

        {/* Name */}
        <div>
          <label htmlFor={`lf-name-${source}`} className="mb-1.5 block text-[12.5px] font-semibold text-foreground/90">
            Full Name <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              id={`lf-name-${source}`}
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className={`${inputBase} pl-10`}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-[11.5px] text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Phone (country-aware, reuses PhoneInput) */}
        <div>
          <label htmlFor={`lf-phone-${source}`} className="mb-1.5 block text-[12.5px] font-semibold text-foreground/90">
            Phone <span className="text-primary">*</span>
          </label>
          <PhoneInput
            id={`lf-phone-${source}`}
            country={country}
            onCountryChange={(c) => syncPhone(national, c)}
            value={national}
            onChange={(v) => syncPhone(v, country)}
            invalid={!!errors.phone}
          />
          {/* RHF holds the E.164 string the schema validates. */}
          <input type="hidden" {...register("phone")} />
          {errors.phone && (
            <p className="mt-1 text-[11.5px] text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label htmlFor={`lf-email-${source}`} className="mb-1.5 block text-[12.5px] font-semibold text-foreground/90">
            Email <span className="font-medium text-muted-foreground">(optional)</span>
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              id={`lf-email-${source}`}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`${inputBase} pl-10`}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-[11.5px] text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Consent */}
        <div>
          <label className="flex items-start gap-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              className="cbx mt-0.5 shrink-0"
              {...register("agree", {
                onChange: () => trigger("agree"),
              })}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms-and-conditions" className="font-semibold text-primary underline-offset-2 hover:underline" target="_blank">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-semibold text-primary underline-offset-2 hover:underline" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.agree && (
            <p className="mt-1 text-[11.5px] text-red-500">{errors.agree.message}</p>
          )}
        </div>

        {/* Turnstile CAPTCHA — only when configured. */}
        {siteKey && (
          <Turnstile
            siteKey={siteKey}
            options={{ size: "flexible", theme: "auto" }}
            onSuccess={(t) => setCaptchaToken(t)}
            onError={() => setCaptchaToken(null)}
            onExpire={() => setCaptchaToken(null)}
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !isValid || (!!siteKey && !captchaToken)}
          className="sweep flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[14px] font-bold text-primary-foreground shadow-glow ring-inner transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              {buttonLabel ?? "Request Free Itinerary"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
            </>
          )}
        </button>

        {(avatars.length > 0 || note) && (
          <div className="flex items-center gap-3 pt-0.5">
            {avatars.length > 0 && (
              <div className="flex -space-x-2">
                {avatars.slice(0, 4).map((a, i) => (
                  <Image
                    key={i}
                    width={28}
                    height={28}
                    src={a}
                    alt=""
                    className="h-7 w-7 rounded-full border-2 border-card object-cover"
                  />
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              {note ?? "Free, no spam — a real human replies on WhatsApp."}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
