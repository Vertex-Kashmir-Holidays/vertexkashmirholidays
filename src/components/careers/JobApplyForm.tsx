"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Turnstile } from "@marsidev/react-turnstile";
import { Loader2, Upload, CheckCircle2, FileText, X, MessageCircle } from "lucide-react";
import type { CountryCode } from "libphonenumber-js";
import { PhoneInput } from "@/components/auth/PhoneInput";
import { toE164 } from "@/lib/auth/validation";
import { nameField, phoneField } from "@/lib/leads/schema";
import { HONEYPOT_FIELD, TIMETRAP_FIELD } from "@/lib/security/formGuard";
import { NEXT_PUBLIC_TURNSTILE_SITE_KEY } from "@/lib/env.public";
import {
  trackApplyStarted,
  trackOtpRequested,
  trackOtpVerified,
  trackApplicationSubmitted,
} from "@/lib/analytics";

const MAX_RESUME_BYTES = 1 * 1024 * 1024; // 1 MB, per project direction (overrides the original 5MB spec)
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const schema = z.object({
  fullName: nameField,
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  phone: phoneField,
  experience: z.string().min(1, "Please enter your total experience"),
  currentCompany: z.string().optional(),
  noticePeriod: z.string().optional(),
  coverLetter: z.string().optional(),
  agree: z.boolean().refine((v) => v === true, {
    message: "Please accept the Privacy Policy.",
  }),
});
type FormValues = z.input<typeof schema>;

type OtpStep = "idle" | "sent" | "verified";

const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-[14px] text-foreground placeholder-foreground/45 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25";

export function JobApplyForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [country, setCountry] = useState<CountryCode>("IN");
  const [national, setNational] = useState("");

  const siteKey = NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef<number>(Date.now());
  const startedRef = useRef(false);

  const [otpStep, setOtpStep] = useState<OtpStep>("idle");
  const [otpCode, setOtpCode] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const verifiedEmailRef = useRef<string | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ fullName: string; whatsappUrl: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      experience: "",
      currentCompany: "",
      noticePeriod: "",
      coverLetter: "",
      agree: false,
    },
  });

  const emailVal = watch("email");

  // Changing the email after verifying invalidates the previous verification —
  // can't verify one address, then submit under a different one.
  useEffect(() => {
    if (otpStep === "verified" && emailVal !== verifiedEmailRef.current) {
      setOtpStep("idle");
      setOtpCode("");
      setVerificationToken(null);
    }
  }, [emailVal, otpStep]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function fireApplyStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackApplyStarted(jobTitle, jobId);
  }

  function syncPhone(nextNational: string, nextCountry: CountryCode) {
    setNational(nextNational);
    setCountry(nextCountry);
    const e164 = toE164(nextNational, nextCountry);
    setValue("phone", e164 ?? nextNational, { shouldValidate: true });
  }

  function handleResumeSelect(file: File) {
    if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
      setResumeError("Please upload a PDF, DOC, or DOCX file.");
      setResumeFile(null);
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setResumeError("File is too large — maximum size is 1 MB.");
      setResumeFile(null);
      return;
    }
    setResumeError(null);
    setResumeFile(file);
  }

  async function requestOtp() {
    const email = emailVal?.trim().toLowerCase();
    if (!email || errors.email) {
      toast.error("Please enter a valid email first.");
      return;
    }
    if (siteKey && !captchaToken) {
      toast.error("Please complete the verification challenge.");
      return;
    }
    setRequestingOtp(true);
    try {
      const res = await fetch("/api/careers/apply/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          turnstileToken: captchaToken ?? undefined,
          [HONEYPOT_FIELD]: honeypotRef.current?.value ?? "",
          [TIMETRAP_FIELD]: renderedAt.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not send the verification code.");
        return;
      }
      setOtpStep("sent");
      setResendIn(data.cooldown ?? 60);
      trackOtpRequested(jobId);
      toast.success("Verification code sent — check your email.");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setRequestingOtp(false);
    }
  }

  async function verifyOtp() {
    const email = emailVal?.trim().toLowerCase();
    if (!email || otpCode.length !== 6) return;
    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/careers/apply/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Incorrect code. Please try again.");
        return;
      }
      setVerificationToken(data.verificationToken);
      verifiedEmailRef.current = email;
      setOtpStep("verified");
      trackOtpVerified(jobId);
      toast.success("Email verified!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function onSubmit(values: FormValues) {
    if (!resumeFile || otpStep !== "verified" || !verificationToken) return;

    setSubmitting(true);
    try {
      const body = new FormData();
      body.set("jobId", jobId);
      body.set("fullName", values.fullName);
      body.set("email", values.email);
      body.set("phone", values.phone);
      body.set("experience", values.experience);
      if (values.currentCompany) body.set("currentCompany", values.currentCompany);
      if (values.noticePeriod) body.set("noticePeriod", values.noticePeriod);
      if (values.coverLetter) body.set("coverLetter", values.coverLetter);
      body.set("agree", String(values.agree));
      body.set("verificationToken", verificationToken);
      body.set("resume", resumeFile);
      body.set(HONEYPOT_FIELD, honeypotRef.current?.value ?? "");
      body.set(TIMETRAP_FIELD, String(renderedAt.current));

      const res = await fetch("/api/careers/apply", { method: "POST", body });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(resData.error ?? "Could not submit your application. Please try again.");
        return;
      }

      trackApplicationSubmitted(jobTitle, jobId);
      setSubmitted({ fullName: values.fullName, whatsappUrl: resData.whatsappUrl });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled =
    otpStep !== "verified" || !isValid || !resumeFile || !!resumeError || submitting;

  if (submitted) {
    return (
      <div className="mt-6 space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-primary" />
        <div>
          <h3 className="font-bold text-foreground">Application Received!</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Thank you, {submitted.fullName}. Your application for <strong>{jobTitle}</strong> at
            Vertex Kashmir Holidays has been received. Our HR team will review your details and
            reach out to you soon.
          </p>
        </div>
        <a
          href={submitted.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
        >
          <MessageCircle className="h-4 w-4" />
          Confirm on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form
      id="apply"
      onSubmit={handleSubmit(onSubmit)}
      onFocus={fireApplyStarted}
      noValidate
      className="mt-6 space-y-3.5 text-left"
    >
      <input
        ref={honeypotRef}
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      <h3 className="font-bold text-foreground text-sm">Apply Now</h3>

      <div>
        <label htmlFor="af-name" className="mb-1 block text-xs font-semibold text-foreground/90">
          Full Name *
        </label>
        <input id="af-name" className={inputClass} {...register("fullName")} />
        {errors.fullName && (
          <p className="mt-1 text-[12px] text-rose-500">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="af-email" className="mb-1 block text-xs font-semibold text-foreground/90">
          Email *
        </label>
        <div className="flex gap-2">
          <input
            id="af-email"
            type="email"
            className={inputClass}
            {...register("email")}
            disabled={otpStep === "verified"}
          />
          {otpStep !== "verified" && (
            <button
              type="button"
              onClick={requestOtp}
              disabled={requestingOtp || !!errors.email || !emailVal}
              className="shrink-0 whitespace-nowrap rounded-xl border border-border px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {requestingOtp ? "Sending…" : otpStep === "sent" ? "Resend" : "Verify Email"}
            </button>
          )}
        </div>
        {errors.email && <p className="mt-1 text-[12px] text-rose-500">{errors.email.message}</p>}
        {otpStep === "verified" && (
          <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Email verified
          </p>
        )}
      </div>

      {otpStep === "sent" && (
        <div className="rounded-xl border border-border bg-muted/50 p-3">
          <label htmlFor="af-otp" className="mb-1 block text-xs font-semibold text-foreground/90">
            Enter the 6-digit code sent to your email
          </label>
          <div className="flex gap-2">
            <input
              id="af-otp"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${inputClass} text-center tracking-[0.3em]`}
              placeholder="------"
            />
            <button
              type="button"
              onClick={verifyOtp}
              disabled={verifyingOtp || otpCode.length !== 6}
              className="shrink-0 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifyingOtp ? "Verifying…" : "Verify"}
            </button>
          </div>
          <button
            type="button"
            onClick={requestOtp}
            disabled={resendIn > 0 || requestingOtp}
            className="mt-2 text-[12px] font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-[3fr_2fr] gap-3">
        <div>
          <label
            htmlFor="af-phone"
            className="mb-1 block text-xs font-semibold text-foreground/90"
          >
            Phone Number *
          </label>
          <PhoneInput
            id="af-phone"
            country={country}
            onCountryChange={(c) => syncPhone(national, c)}
            value={national}
            onChange={(v) => syncPhone(v, country)}
            invalid={!!errors.phone}
          />
          <input type="hidden" {...register("phone")} />
          {errors.phone && (
            <p className="mt-1 text-[12px] text-rose-500">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="af-experience"
            className="mb-1 block text-xs font-semibold text-foreground/90"
          >
            Total Experience *
          </label>
          <input
            id="af-experience"
            className={inputClass}
            placeholder="e.g. 2 years"
            {...register("experience")}
          />
          {errors.experience && (
            <p className="mt-1 text-[12px] text-rose-500">{errors.experience.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="af-company"
            className="mb-1 block text-xs font-semibold text-foreground/90"
          >
            Current Company <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="af-company" className={inputClass} {...register("currentCompany")} />
        </div>

        <div>
          <label htmlFor="af-notice" className="mb-1 block text-xs font-semibold text-foreground/90">
            Notice Period <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input id="af-notice" className={inputClass} {...register("noticePeriod")} />
        </div>
      </div>

      <div>
        <label htmlFor="af-cover" className="mb-1 block text-xs font-semibold text-foreground/90">
          Cover Letter <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea id="af-cover" rows={3} className={inputClass} {...register("coverLetter")} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-foreground/90">Resume *</label>
        {resumeFile ? (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-3.5 py-2.5">
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-foreground">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{resumeFile.name}</span>
            </span>
            <button
              type="button"
              onClick={() => setResumeFile(null)}
              className="shrink-0 text-muted-foreground hover:text-rose-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-4 text-[13px] font-semibold text-muted-foreground transition hover:border-primary hover:text-primary">
            <Upload className="h-4 w-4" />
            Upload PDF, DOC, or DOCX (max 1 MB)
            <input
              type="file"
              accept="application/pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleResumeSelect(e.target.files[0])}
            />
          </label>
        )}
        {resumeError && <p className="mt-1 text-[12px] text-rose-500">{resumeError}</p>}
      </div>

      <label className="flex items-start gap-2.5 text-[12px] leading-relaxed text-muted-foreground">
        <input type="checkbox" className="cbx mt-0.5 shrink-0" {...register("agree")} />
        <span>I agree to the Privacy Policy and consent to my data being used for this application.</span>
      </label>
      {errors.agree && <p className="text-[12px] text-rose-500">{errors.agree.message}</p>}

      {siteKey && otpStep !== "verified" && (
        <Turnstile
          siteKey={siteKey}
          options={{ size: "flexible", theme: "auto" }}
          onSuccess={(t) => setCaptchaToken(t)}
          onError={() => setCaptchaToken(null)}
          onExpire={() => setCaptchaToken(null)}
        />
      )}

      <button
        type="submit"
        disabled={submitDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? "Submitting…" : "Submit Application"}
      </button>
      {otpStep !== "verified" && (
        <p className="text-center text-[12px] text-muted-foreground">
          Verify your email above to enable submission.
        </p>
      )}
    </form>
  );
}
