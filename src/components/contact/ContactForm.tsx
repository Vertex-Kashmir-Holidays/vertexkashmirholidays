// src/components/contact/ContactForm.tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";
import { ShieldCheck, ArrowRight } from "lucide-react";
import type { CountryCode } from "libphonenumber-js";
import { WhatsAppIcon } from "@/components/icons/brand";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { toE164 } from "@/lib/auth/validation";
import { nameField, phoneField } from "@/lib/leads/schema";
import { HONEYPOT_FIELD, TIMETRAP_FIELD } from "@/lib/security/formGuard";
import { NEXT_PUBLIC_TURNSTILE_SITE_KEY } from "@/lib/env.public";
import type { ContactFormContent } from "@/types/contact";
import { trackLeadSubmit } from "@/lib/analytics";

// Reuses the shared lead primitives (name sanitize + E.164 phone) so the
// contact form validates identically to the rest of the site. Email is required
// here (unlike the optional lead form), and consent is mandatory.
const schema = z.object({
  name: nameField,
  phone: phoneField,
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  message: z.string().trim().max(2000).optional(),
  agree: z.boolean().refine((v) => v === true, {
    message: "Please accept the Terms & Conditions and Privacy Policy.",
  }),
});
type FormValues = z.input<typeof schema>;

const formTrust = ["No spam. Ever.", "We reply within 2 hours", "100% free advice"];

interface ContactFormProps {
  content: ContactFormContent;
}

export function ContactForm({ content }: ContactFormProps) {
  const [country, setCountry] = useState<CountryCode>("IN");
  const [national, setNational] = useState("");

  const siteKey = NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef<number>(Date.now());

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onChange" });

  function syncPhone(nextNational: string, nextCountry: CountryCode) {
    setNational(nextNational);
    setCountry(nextCountry);
    const e164 = toE164(nextNational, nextCountry);
    setValue("phone", e164 ?? nextNational, { shouldValidate: true });
  }

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          message: data.message || undefined,
          agree: data.agree,
          source: "contact",
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? "",
          [TIMETRAP_FIELD]: renderedAt.current,
          turnstileToken: captchaToken ?? undefined,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as {
          error?: string;
          blocked?: boolean;
          fieldErrors?: Record<string, string[] | undefined>;
        };
        // Map validation failures onto their fields (inline, no stack traces).
        if (j.fieldErrors) {
          for (const key of ["name", "phone", "email", "message", "agree"] as const) {
            const msg = j.fieldErrors[key]?.[0];
            if (msg) setError(key, { type: "server", message: msg });
          }
          return;
        }
        throw new Error(j.error ?? "Request failed");
      }
      trackLeadSubmit("contact");
      toast.success("Message sent! We'll reply within 2 hours.");
      reset();
      setNational("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[14px] text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <aside className="rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-24">
      <motion.p
        className="text-[12px] font-bold tracking-[0.22em] text-primary"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {content.kicker}
      </motion.p>
      <motion.h2
        className="h-display mt-2 font-display text-[18px] font-bold leading-snug"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {content.title}
      </motion.h2>

      <form className="mt-5 space-y-3.5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <input
          ref={honeypotRef}
          type="text"
          name={HONEYPOT_FIELD}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        />
        <div>
          <label htmlFor="cName" className="text-[14px] font-semibold">
            Your Name <span className="text-rose-500">*</span>
          </label>
          <input
            id="cName"
            className={inputClass}
            placeholder="Enter your name"
            {...register("name")}
          />
          {errors.name && <p className="mt-1 text-[12px] text-rose-500">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="cEmail" className="text-[14px] font-semibold">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            id="cEmail"
            type="email"
            className={inputClass}
            placeholder="Enter your email"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-[12px] text-rose-500">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="cPhone" className="text-[14px] font-semibold">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <PhoneInput
            id="cPhone"
            country={country}
            onCountryChange={(c) => syncPhone(national, c)}
            value={national}
            onChange={(v) => syncPhone(v, country)}
            invalid={!!errors.phone}
          />
          <input type="hidden" {...register("phone")} />
          {errors.phone && <p className="mt-1 text-[12px] text-rose-500">{errors.phone.message}</p>}
        </div>
        <div>
          <label htmlFor="cMsg" className="text-[14px] font-semibold">
            Message
          </label>
          <textarea
            id="cMsg"
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Tell us about your dream trip..."
            {...register("message")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] font-semibold text-foreground/70">
          {formTrust.map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
              {t}
            </span>
          ))}
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              className="cbx mt-0.5 shrink-0"
              {...register("agree", { onChange: () => trigger("agree") })}
            />
            <span>
              I agree to the{" "}
              <Link
                href="/terms-and-conditions"
                target="_blank"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.agree && <p className="mt-1 text-[12px] text-rose-500">{errors.agree.message}</p>}
        </div>

        {siteKey && (
          <Turnstile
            siteKey={siteKey}
            options={{ size: "flexible", theme: "auto" }}
            onSuccess={(t) => setCaptchaToken(t)}
            onError={() => setCaptchaToken(null)}
            onExpire={() => setCaptchaToken(null)}
          />
        )}

        <motion.button
          type="submit"
          disabled={isSubmitting || (!!siteKey && !captchaToken)}
          className="!mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-[14px] font-bold text-primary-foreground shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? "Sending…" : "Send Message"}
          {!isSubmitting && <ArrowRight className="h-4 w-4" strokeWidth={2.2} />}
        </motion.button>
      </form>

      {content.note && (
        <p className="mt-3.5 flex items-center justify-center gap-2 text-[14px] text-muted-foreground">
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
          {content.note}{" "}
          <Link href={content.whatsappHref} className="font-bold text-primary hover:underline">
            Chat instantly
          </Link>
        </p>
      )}
    </aside>
  );
}
