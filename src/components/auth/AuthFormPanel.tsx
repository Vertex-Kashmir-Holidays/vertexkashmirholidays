// src/components/sections/AuthFormPanel.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Heart, Mail, Eye, EyeOff, ShieldCheck, User, Check } from 'lucide-react';
import type { CountryCode } from 'libphonenumber-js';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/brand/Logo';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { GoogleOneTap } from '@/components/auth/GoogleOneTap';
import { resolveAuthDestination } from '@/lib/auth/destination';
import {
  EMAIL_FORMAT_MESSAGE,
  PASSWORD_MESSAGE,
  PHONE_MESSAGE,
  PUBLIC_DOMAINS_GENERIC_MESSAGE,
  isAllowedEmailDomain,
  isValidEmailFormat,
  isValidPassword,
  isValidPhone,
  toE164,
} from '@/lib/auth/validation';

type FieldErrors = Partial<
  Record<'name' | 'email' | 'phone' | 'password' | 'confirm' | 'terms', string>
>;

// Small inline field-error line shown under an input (custom messages only).
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-[11.5px] font-medium text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

interface AuthFormPanelProps {
  view: 'login' | 'register';
  onViewChange: (view: 'login' | 'register') => void;
  /** CSP nonce for this request — forwarded to Google One Tap's injected script. */
  nonce?: string;
}

export function AuthFormPanel({ view, onViewChange, nonce }: AuthFormPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Turnstile (rendered + enforced only when the public site key is set).
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Surface NextAuth's OAuth error redirect (e.g. ?error=AccessDenied when the
  // Google signIn callback rejects a staff/company-domain account) as the same
  // banner the login form already shows, then strip it from the URL.
  useEffect(() => {
    if (searchParams.get('error') !== 'AccessDenied') return;
    setError(
      "This Google account can't be used here. Please sign in with your email and password, or use a personal email address (Gmail, Outlook, Yahoo, etc.) to create a new account.",
    );
    router.replace('/login');
  }, [searchParams, router]);

  // Forgot-password flow (login view only), a 3-step machine: 'login' is the
  // normal card; 'forgot-request' asks for the email only and requests an OTP;
  // 'forgot-otp' verifies the emailed code (proving email ownership, without
  // yet touching the password) and receives a one-time resetToken; only then
  // does 'forgot-reset' collect + apply the new password. Reuses the same
  // otp/resend state as the registration step machine below.
  const [loginStep, setLoginStep] = useState<
    'login' | 'forgot-request' | 'forgot-otp' | 'forgot-reset'
  >('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState<string | undefined>(undefined);
  const [resetToken, setResetToken] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotErrors, setForgotErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);

  function resetForgotFlow() {
    setLoginStep('login');
    setForgotEmail('');
    setForgotEmailError(undefined);
    setResetToken('');
    setForgotPassword('');
    setForgotConfirm('');
    setForgotErrors({});
    setError(null);
    setNotice(null);
    setOtpCode('');
    setCaptchaToken(null);
  }

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState(''); // national number as typed
  const [country, setCountry] = useState<CountryCode>('IN');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // Clears a single field error (called as the user edits that field).
  function clearError(field: keyof FieldErrors) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  // Validates the whole register form, populating per-field custom messages.
  function validateRegister(): boolean {
    const e: FieldErrors = {};
    if (!regName.trim()) e.name = 'Please enter your full name.';

    if (!regEmail.trim()) e.email = 'Please enter your email address.';
    else if (!isValidEmailFormat(regEmail)) e.email = EMAIL_FORMAT_MESSAGE;
    else if (!isAllowedEmailDomain(regEmail))
      e.email = PUBLIC_DOMAINS_GENERIC_MESSAGE;

    if (!regPhone.trim()) e.phone = 'Please enter your phone number.';
    else if (!isValidPhone(regPhone, country)) e.phone = PHONE_MESSAGE;

    if (!regPassword) e.password = 'Please create a password.';
    else if (!isValidPassword(regPassword)) e.password = PASSWORD_MESSAGE;

    if (!regConfirm) e.confirm = 'Please confirm your password.';
    else if (regPassword !== regConfirm) e.confirm = 'Passwords do not match.';

    if (!agree)
      e.terms = 'Please accept the Terms & Conditions and Privacy Policy.';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Two-step registration: 'form' collects details + requests an OTP, 'otp'
  // verifies the emailed code before the account is created.
  const [regStep, setRegStep] = useState<'form' | 'otp'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendIn, setResendIn] = useState(0); // seconds left on resend cooldown
  const [notice, setNotice] = useState<string | null>(null);

  // Tick down the resend cooldown once per second.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Reset the register flow whenever we switch top-level views.
  function switchView(next: 'login' | 'register') {
    setError(null);
    setNotice(null);
    setRegStep('form');
    setOtpCode('');
    setErrors({});
    setLoginErrors({});
    setCaptchaToken(null);
    setLoginStep('login');
    setForgotEmail('');
    setForgotEmailError(undefined);
    setResetToken('');
    setForgotPassword('');
    setForgotConfirm('');
    setForgotErrors({});
    onViewChange(next);
  }

  // Turnstile widget, shown on each form step when configured.
  const captcha = siteKey ? (
    <Turnstile
      siteKey={siteKey}
      options={{ size: 'flexible', theme: 'auto' }}
      onSuccess={(t) => setCaptchaToken(t)}
      onError={() => setCaptchaToken(null)}
      onExpire={() => setCaptchaToken(null)}
    />
  ) : null;
  const captchaPending = !!siteKey && !captchaToken;

  // After a successful sign-in, send the user to the page they came from
  // (?callbackUrl=…), or to the role-aware landing endpoint which routes staff
  // vs customers. Only same-origin relative paths are honoured. Client-only —
  // only ever call this from an event handler, never at render time.
  const destination = resolveAuthDestination;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Custom required-field checks (the form is noValidate — no native bubbles).
    const le: { email?: string; password?: string } = {};
    if (!loginEmail.trim()) le.email = 'Please enter your email address.';
    else if (!isValidEmailFormat(loginEmail))
      le.email = EMAIL_FORMAT_MESSAGE;
    if (!loginPassword) le.password = 'Please enter your password.';
    setLoginErrors(le);
    if (Object.keys(le).length > 0) return;

    setSubmitting(true);

    const result = await signIn('credentials', {
      email: loginEmail,
      password: loginPassword,
      turnstileToken: captchaToken ?? undefined,
      redirect: false,
    });

    if (result?.error) {
      setError('Invalid email or password.');
      setSubmitting(false);
      return;
    }

    router.push(destination());
    router.refresh();
  }

  // Step 1 — validate the form and request an email OTP. The account is NOT
  // created here; on success we advance to the code-entry step.
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!validateRegister()) return;

    // validateRegister already confirmed the number is valid for the country.
    const phoneE164 = toE164(regPhone, country);
    if (!phoneE164) {
      setErrors((prev) => ({ ...prev, phone: PHONE_MESSAGE }));
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/auth/register/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        phone: phoneE164,
        password: regPassword,
        turnstileToken: captchaToken ?? undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? 'Could not send the verification code. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setRegStep('otp');
    setOtpCode('');
    setResendIn(data.cooldown ?? 60);
    setNotice(`We sent a 6-digit code to ${regEmail}. It expires in 10 minutes.`);
  }

  // Step 2 — verify the emailed code. On success the account exists, so we sign
  // the user in and redirect.
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    const res = await fetch('/api/auth/register/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regEmail, code: otpCode }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? 'Verification failed. Please try again.');
      setVerifying(false);
      return;
    }

    const result = await signIn('credentials', {
      email: regEmail,
      password: regPassword,
      redirect: false,
    });

    if (result?.error) {
      setVerifying(false);
      setError('Account created, but sign-in failed. Please log in.');
      switchView('login');
      return;
    }

    router.push(destination());
    router.refresh();
  }

  // Resend a fresh code (subject to the 60s cooldown enforced server-side).
  async function handleResendOtp() {
    if (resendIn > 0 || resending) return;
    setError(null);
    setNotice(null);
    setResending(true);

    const res = await fetch('/api/auth/register/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        phone: toE164(regPhone, country) ?? regPhone,
        password: regPassword,
        turnstileToken: captchaToken ?? undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setResending(false);

    if (!res.ok) {
      setError(data.error ?? 'Could not resend the code. Please try again.');
      if (data.retryAfter) setResendIn(data.retryAfter);
      return;
    }

    setOtpCode('');
    setResendIn(data.cooldown ?? 60);
    setNotice(`A new code was sent to ${regEmail}.`);
  }

  // Step 1 of forgot-password: validate the new password and request an OTP.
  // Mirrors handleRegister — the password is NOT applied until the code is
  // verified in handleForgotVerify — the password itself isn't collected until
  // handleForgotReset, after email ownership is proven.
  async function handleForgotRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!forgotEmail.trim()) {
      setForgotEmailError('Please enter your email address.');
      return;
    }
    if (!isValidEmailFormat(forgotEmail)) {
      setForgotEmailError(EMAIL_FORMAT_MESSAGE);
      return;
    }
    setForgotEmailError(undefined);

    setSubmitting(true);

    const res = await fetch('/api/auth/forgot-password/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: forgotEmail,
        turnstileToken: captchaToken ?? undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? 'Could not send the verification code. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setLoginStep('forgot-otp');
    setOtpCode('');
    setResendIn(data.cooldown ?? 60);
    setNotice(`We sent a 6-digit code to ${forgotEmail}. It expires in ${data.ttlMinutes ?? 5} minutes.`);
  }

  // Step 2 of forgot-password: verify the emailed code. This proves email
  // ownership and returns a one-time resetToken — the password is still
  // untouched. Advances to the 'forgot-reset' step to collect the new password.
  async function handleForgotVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);

    const res = await fetch('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail, code: otpCode }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? 'Verification failed. Please try again.');
      setVerifying(false);
      return;
    }

    setVerifying(false);
    setResetToken(data.resetToken);
    setError(null);
    setNotice(null);
    setLoginStep('forgot-reset');
  }

  async function handleForgotResend() {
    if (resendIn > 0 || resending) return;
    setError(null);
    setNotice(null);
    setResending(true);

    const res = await fetch('/api/auth/forgot-password/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: forgotEmail,
        turnstileToken: captchaToken ?? undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setResending(false);

    if (!res.ok) {
      setError(data.error ?? 'Could not resend the code. Please try again.');
      if (data.retryAfter) setResendIn(data.retryAfter);
      return;
    }

    setOtpCode('');
    setResendIn(data.cooldown ?? 60);
    setNotice(`A new code was sent to ${forgotEmail}.`);
  }

  // Step 3 of forgot-password: only reachable after email ownership was
  // proven in step 2. Applies the new password using the one-time resetToken,
  // then signs in with it (same pattern as handleVerifyOtp post-registration).
  function validateForgotReset(): boolean {
    const e: typeof forgotErrors = {};
    if (!forgotPassword) e.password = 'Please create a new password.';
    else if (!isValidPassword(forgotPassword)) e.password = PASSWORD_MESSAGE;

    if (!forgotConfirm) e.confirm = 'Please confirm your new password.';
    else if (forgotPassword !== forgotConfirm) e.confirm = 'Passwords do not match.';

    setForgotErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleForgotReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateForgotReset()) return;

    setSubmitting(true);

    const res = await fetch('/api/auth/forgot-password/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: forgotEmail,
        resetToken,
        newPassword: forgotPassword,
        confirmPassword: forgotConfirm,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? 'Could not reset your password. Please try again.');
      setSubmitting(false);
      return;
    }

    const result = await signIn('credentials', {
      email: forgotEmail,
      password: forgotPassword,
      redirect: false,
    });

    if (result?.error) {
      setSubmitting(false);
      setError('Password reset, but sign-in failed. Please log in.');
      resetForgotFlow();
      return;
    }

    router.push(destination());
    router.refresh();
  }

  const oauthButtons = (
    <div className="space-y-3">
      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold transition hover:bg-muted"
        onClick={() => signIn('google', { callbackUrl: destination() })}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
          <path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9.1L6.4 14Z" />
          <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5L18.7 4.7A10 10 0 0 0 3.1 7.5L6.4 10c.8-2.3 3-4 5.6-4Z" />
        </svg>
        Continue with Google
      </button>
    </div>
  );

  return (
    <section className="flex min-w-0 flex-col p-4 sm:p-6 lg:p-9">
      {/* Mobile/tablet brand — the image panel (which carries the logo) is hidden below lg */}
      <Logo variant="auto" href="/" className="mb-5 self-start lg:hidden" />

      <div className="flex items-center justify-between gap-3">
        <ThemeToggle />
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-foreground/75 transition hover:text-primary"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="mx-auto mt-6 w-full max-w-[400px] overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Login View */}
          {view === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loginStep === 'login' ? (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:p-7">
                <GoogleOneTap nonce={nonce} />
                <h2 className="flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Welcome back
                  <Heart className="h-5 w-5 text-primary" fill="currentColor" strokeWidth={0} />
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Log in to your account to manage your bookings, view itineraries and more.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleLogin} noValidate>
                  {view === 'login' && error && (
                    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="liEmail">Email address</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="liEmail"
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value);
                          if (loginErrors.email)
                            setLoginErrors((p) => ({ ...p, email: undefined }));
                        }}
                      />
                      <Mail className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" strokeWidth={2} />
                    </div>
                    <FieldError message={loginErrors.email} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="liPass">Password</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="liPass"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value);
                          if (loginErrors.password)
                            setLoginErrors((p) => ({ ...p, password: undefined }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <EyeOff className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    <FieldError message={loginErrors.password} />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setNotice(null);
                          setLoginStep('forgot-request');
                        }}
                        className="text-[12px] font-semibold text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2.5 text-[12.5px] font-medium text-foreground/80">
                    <input type="checkbox" className="cbx" /> Remember me
                  </label>
                  {captcha}
                  <button
                    type="submit"
                    disabled={submitting || captchaPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Logging in…' : 'Log In'}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </form>

                <div className="mt-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-border"></span>
                  <span className="text-[11px] font-medium text-muted-foreground">or continue with</span>
                  <span className="h-px flex-1 bg-border"></span>
                </div>

                <div className="mt-5">{oauthButtons}</div>

                <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => switchView('register')} className="font-bold text-primary hover:underline">
                    Create one
                  </button>
                </p>

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/10 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
                  <p className="text-[12px] leading-snug">
                    <strong className="text-[12.5px]">Your data is safe with us</strong>
                    <br />
                    <span className="text-muted-foreground">We never share your information with anyone.</span>
                  </p>
                </div>
              </div>
              ) : loginStep === 'forgot-request' ? (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:p-7">
                <button
                  type="button"
                  onClick={resetForgotFlow}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground transition hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  Back to login
                </button>

                <h2 className="mt-4 flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Reset your password
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Enter your account email. If it matches an account, we'll email you a verification code.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleForgotRequest} noValidate>
                  {error && (
                    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="fpEmail">Email address</label>
                    <div className={`input-wrap mt-1.5 ${forgotEmailError ? 'ring-1 ring-red-500/60' : ''}`}>
                      <input
                        id="fpEmail"
                        type="email"
                        placeholder="Enter your account email"
                        autoComplete="email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          if (forgotEmailError) setForgotEmailError(undefined);
                        }}
                      />
                      <Mail className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" strokeWidth={2} />
                    </div>
                    <FieldError message={forgotEmailError} />
                  </div>
                  {captcha}
                  <button
                    type="submit"
                    disabled={submitting || captchaPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Sending code…' : 'Send verification code'}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </form>
              </div>
              ) : loginStep === 'forgot-otp' ? (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:p-7">
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('forgot-request');
                    setError(null);
                    setNotice(null);
                  }}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground transition hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  Edit details
                </button>

                <h2 className="mt-4 flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Verify your email
                  <Mail className="h-5 w-5 text-primary" strokeWidth={1.8} />
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Enter the 6-digit code we sent to{' '}
                  <strong className="text-foreground">{forgotEmail}</strong>.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleForgotVerify}>
                  {error && (
                    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  {!error && notice && (
                    <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-[12px] font-semibold text-primary">
                      {notice}
                    </p>
                  )}

                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="fpOtpCode">Verification code</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="fpOtpCode"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        placeholder="------"
                        className="text-center font-semibold tracking-[0.5em]"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={verifying || otpCode.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifying ? 'Verifying…' : 'Verify code'}
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </form>

                {siteKey && <div className="mt-5">{captcha}</div>}

                <div className="mt-5 text-center text-[12.5px] text-muted-foreground">
                  Didn&apos;t get the code?{' '}
                  {resendIn > 0 ? (
                    <span className="font-semibold text-foreground/70">Resend in {resendIn}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleForgotResend}
                      disabled={resending}
                      className="font-bold text-primary hover:underline disabled:opacity-60"
                    >
                      {resending ? 'Sending…' : 'Resend code'}
                    </button>
                  )}
                </div>
              </div>
              ) : (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:p-7">
                <h2 className="flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Set a new password
                  <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.8} />
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Your email is verified. Choose a new password for{' '}
                  <strong className="text-foreground">{forgotEmail}</strong>.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleForgotReset} noValidate>
                  {error && (
                    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="fpPass">New password</label>
                    <div className={`input-wrap mt-1.5 ${forgotErrors.password ? 'ring-1 ring-red-500/60' : ''}`}>
                      <input
                        id="fpPass"
                        type={showForgotPassword ? 'text' : 'password'}
                        placeholder="Create a new password"
                        autoComplete="new-password"
                        value={forgotPassword}
                        onChange={(e) => {
                          setForgotPassword(e.target.value);
                          if (forgotErrors.password) setForgotErrors((p) => ({ ...p, password: undefined }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(!showForgotPassword)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        {showForgotPassword ? (
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <EyeOff className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    {forgotErrors.password ? (
                      <FieldError message={forgotErrors.password} />
                    ) : (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Use at least 8 characters with letters and numbers.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="fpPass2">Confirm new password</label>
                    <div className={`input-wrap mt-1.5 ${forgotErrors.confirm ? 'ring-1 ring-red-500/60' : ''}`}>
                      <input
                        id="fpPass2"
                        type={showForgotConfirm ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        autoComplete="new-password"
                        value={forgotConfirm}
                        onChange={(e) => {
                          setForgotConfirm(e.target.value);
                          if (forgotErrors.confirm) setForgotErrors((p) => ({ ...p, confirm: undefined }));
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirm(!showForgotConfirm)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        {showForgotConfirm ? (
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <EyeOff className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    <FieldError message={forgotErrors.confirm} />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Saving…' : 'Reset Password'}
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </form>
              </div>
              )}
            </motion.div>
          )}

          {/* Register View */}
          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {regStep === 'form' ? (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:p-7">
                <h2 className="flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Create your account
                  <Heart className="h-5 w-5 text-primary" fill="currentColor" strokeWidth={0} />
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Join thousands of happy travellers.<br/>It only takes a minute.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleRegister} noValidate>
                  {view === 'register' && error && (
                    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgName">Full name</label>
                    <div className={`input-wrap mt-1.5 ${errors.name ? 'ring-1 ring-red-500/60' : ''}`}>
                      <input
                        id="rgName"
                        placeholder="Enter your full name"
                        autoComplete="name"
                        value={regName}
                        onChange={(e) => {
                          setRegName(e.target.value);
                          clearError('name');
                        }}
                      />
                      <User className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" strokeWidth={2} />
                    </div>
                    <FieldError message={errors.name} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgEmail">Email address</label>
                    <div className={`input-wrap mt-1.5 ${errors.email ? 'ring-1 ring-red-500/60' : ''}`}>
                      <input
                        id="rgEmail"
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          clearError('email');
                        }}
                      />
                      <Mail className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" strokeWidth={2} />
                    </div>
                    <FieldError message={errors.email} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgPhone">Phone number</label>
                    <PhoneInput
                      id="rgPhone"
                      country={country}
                      onCountryChange={(c) => {
                        setCountry(c);
                        clearError('phone');
                      }}
                      value={regPhone}
                      onChange={(v) => {
                        setRegPhone(v);
                        clearError('phone');
                      }}
                      invalid={!!errors.phone}
                    />
                    <FieldError message={errors.phone} />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgPass">Password</label>
                    <div className={`input-wrap mt-1.5 ${errors.password ? 'ring-1 ring-red-500/60' : ''}`}>
                      <input
                        id="rgPass"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          clearError('password');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <EyeOff className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    {errors.password ? (
                      <FieldError message={errors.password} />
                    ) : (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Use at least 8 characters with letters and numbers.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgPass2">Confirm password</label>
                    <div className={`input-wrap mt-1.5 ${errors.confirm ? 'ring-1 ring-red-500/60' : ''}`}>
                      <input
                        id="rgPass2"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        value={regConfirm}
                        onChange={(e) => {
                          setRegConfirm(e.target.value);
                          clearError('confirm');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <EyeOff className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>
                    <FieldError message={errors.confirm} />
                  </div>
                  <div>
                    <label className="flex items-start gap-2.5 text-[12px] leading-snug text-foreground/80">
                      <input
                        type="checkbox"
                        className="cbx mt-0.5"
                        checked={agree}
                        onChange={(e) => {
                          setAgree(e.target.checked);
                          clearError('terms');
                        }}
                      />
                      <span>
                        I agree to the{' '}
                        <Link
                          href="/terms-and-conditions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-primary hover:underline"
                        >
                          Terms &amp; Conditions
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-primary hover:underline"
                        >
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    <FieldError message={errors.terms} />
                  </div>
                  {captcha}
                  <button
                    type="submit"
                    disabled={submitting || captchaPending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Creating account…' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </form>

                <div className="mt-6 flex items-center gap-4">
                  <span className="h-px flex-1 bg-border"></span>
                  <span className="text-[11px] font-medium text-muted-foreground">or continue with</span>
                  <span className="h-px flex-1 bg-border"></span>
                </div>

                <div className="mt-5">{oauthButtons}</div>

                <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
                  Already have an account?{' '}
                  <button onClick={() => switchView('login')} className="font-bold text-primary hover:underline">
                    Log in
                  </button>
                </p>

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/10 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
                  <p className="text-[12px] leading-snug">
                    <strong className="text-[12.5px]">Your data is safe with us</strong>
                    <br />
                    <span className="text-muted-foreground">We never share your information with anyone.</span>
                  </p>
                </div>
              </div>
              ) : (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:p-7">
                <button
                  type="button"
                  onClick={() => {
                    setRegStep('form');
                    setError(null);
                    setNotice(null);
                  }}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground transition hover:text-primary"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  Edit details
                </button>

                <h2 className="mt-4 flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Verify your email
                  <Mail className="h-5 w-5 text-primary" strokeWidth={1.8} />
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Enter the 6-digit code we sent to{' '}
                  <strong className="text-foreground">{regEmail}</strong>.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleVerifyOtp}>
                  {error && (
                    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  {!error && notice && (
                    <p className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-[12px] font-semibold text-primary">
                      {notice}
                    </p>
                  )}

                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="otpCode">Verification code</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="otpCode"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        placeholder="------"
                        className="text-center font-semibold tracking-[0.5em]"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={verifying || otpCode.length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verifying ? 'Verifying…' : 'Verify & Create Account'}
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </form>

                {siteKey && <div className="mt-5">{captcha}</div>}

                <div className="mt-5 text-center text-[12.5px] text-muted-foreground">
                  Didn&apos;t get the code?{' '}
                  {resendIn > 0 ? (
                    <span className="font-semibold text-foreground/70">Resend in {resendIn}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="font-bold text-primary hover:underline disabled:opacity-60"
                    >
                      {resending ? 'Sending…' : 'Resend code'}
                    </button>
                  )}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/10 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.8} />
                  <p className="text-[12px] leading-snug">
                    <strong className="text-[12.5px]">Your account isn&apos;t created yet</strong>
                    <br />
                    <span className="text-muted-foreground">It&apos;s only created once your email is verified.</span>
                  </p>
                </div>
              </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}