// src/components/sections/AuthFormPanel.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/brand/Logo';

interface AuthFormPanelProps {
  view: 'login' | 'register';
  onViewChange: (view: 'login' | 'register') => void;
}

export function AuthFormPanel({ view, onViewChange }: AuthFormPanelProps) {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

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
    onViewChange(next);
  }

  // After a successful sign-in, send the user to the page they came from
  // (?callbackUrl=…), or to the role-aware landing endpoint which routes staff
  // vs customers. Only same-origin relative paths are honoured.
  function destination() {
    const cb = new URLSearchParams(window.location.search).get('callbackUrl');
    if (cb) {
      try {
        const path = new URL(cb, window.location.origin).pathname;
        if (path.startsWith('/') && !path.startsWith('/login')) return path;
      } catch {
        /* ignore malformed callbackUrl */
      }
    }
    return '/auth/redirect';
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn('credentials', {
      email: loginEmail,
      password: loginPassword,
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

    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    const res = await fetch('/api/auth/register/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
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
        phone: regPhone,
        password: regPassword,
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

  const oauthButtons = (
    <div className="space-y-3">
      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold transition hover:bg-muted"
        onClick={() => alert('Google sign-in — wire to Auth.js provider')}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
          <path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9.1L6.4 14Z" />
          <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5L18.7 4.7A10 10 0 0 0 3.1 7.5L6.4 10c.8-2.3 3-4 5.6-4Z" />
        </svg>
        Continue with Google
      </button>
      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold transition hover:bg-muted"
        onClick={() => alert('Apple sign-in — wire to Auth.js provider')}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M16.7 12.8c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.2-.9-1.7 0-3.2 1-4 2.5-1.7 3-0.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.4-1-2.4-3.9ZM14.4 5.6c.7-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.4-.6.7-1.2 1.9-1 3 1 .1 2.1-.6 2.8-1.4Z" />
        </svg>
        Continue with Apple
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
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6 lg:p-7">
                <h2 className="flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Welcome back
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="currentColor">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                  </svg>
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Log in to your account to manage your bookings, view itineraries and more.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleLogin}>
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
                        required
                        placeholder="Enter your email"
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                      <svg viewBox="0 0 24 24" className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 6L2 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="liPass">Password</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="liPass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          {showPassword ? (
                            <>
                              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          ) : (
                            <>
                              <path d="M17.5 17.5 6.5 6.5" />
                              <path d="M9.5 9.5A3 3 0 0 0 12 15a3 3 0 0 0 1.5-.4" />
                              <path d="M2 12s2.5-5 10-5c3.5 0 6.5 1.5 8 3.5" />
                              <path d="M2 12s2.5-5 10-5c3.5 0 6.5 1.5 8 3.5" />
                              <path d="M22 12s-2.5 5-10 5c-1.5 0-3-.3-4.5-1" />
                              <path d="M8.5 8.5a5 5 0 0 0 6 6" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <a href="#" className="text-[12px] font-semibold text-primary hover:underline">Forgot password?</a>
                    </div>
                  </div>
                  <label className="flex items-center gap-2.5 text-[12.5px] font-medium text-foreground/80">
                    <input type="checkbox" className="cbx" /> Remember me
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Logging in…' : 'Log In'}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
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
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <p className="text-[12px] leading-snug">
                    <strong className="text-[12.5px]">Your data is safe with us</strong>
                    <br />
                    <span className="text-muted-foreground">We never share your information with anyone.</span>
                  </p>
                </div>
              </div>
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
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="currentColor">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                  </svg>
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Join thousands of happy travellers.<br/>It only takes a minute.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleRegister}>
                  {view === 'register' && error && (
                    <p className="rounded-xl bg-red-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgName">Full name</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="rgName"
                        required
                        placeholder="Enter your full name"
                        autoComplete="name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                      <svg viewBox="0 0 24 24" className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21a8 8 0 0 1 16 0" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgEmail">Email address</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="rgEmail"
                        type="email"
                        required
                        placeholder="Enter your email"
                        autoComplete="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                      <svg viewBox="0 0 24 24" className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 6L2 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgPhone">Phone number</label>
                    <div className="input-wrap mt-1.5">
                      <button type="button" className="ml-3.5 flex shrink-0 items-center gap-1.5 border-r border-border pr-3 text-[12.5px] font-semibold">
                        <span className="inline-block h-3.5 w-5 overflow-hidden rounded-[2px]" aria-hidden="true">
                          <span className="block h-1/3 bg-orange-500"></span>
                          <span className="block h-1/3 bg-white"></span>
                          <span className="block h-1/3 bg-green-700"></span>
                        </span>
                        <svg viewBox="0 0 24 24" className="h-3 w-3 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                        +91
                      </button>
                      <input
                        id="rgPhone"
                        type="tel"
                        required
                        placeholder="Enter your phone number"
                        autoComplete="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                      />
                      <svg viewBox="0 0 24 24" className="mr-3.5 h-4 w-4 shrink-0 text-muted-foreground/70" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgPass">Password</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="rgPass"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Create a password"
                        autoComplete="new-password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          {showPassword ? (
                            <>
                              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          ) : (
                            <>
                              <path d="M17.5 17.5 6.5 6.5" />
                              <path d="M9.5 9.5A3 3 0 0 0 12 15a3 3 0 0 0 1.5-.4" />
                              <path d="M2 12s2.5-5 10-5c3.5 0 6.5 1.5 8 3.5" />
                              <path d="M22 12s-2.5 5-10 5c-1.5 0-3-.3-4.5-1" />
                              <path d="M8.5 8.5a5 5 0 0 0 6 6" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold" htmlFor="rgPass2">Confirm password</label>
                    <div className="input-wrap mt-1.5">
                      <input
                        id="rgPass2"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Show password"
                        className="mr-3.5 shrink-0 text-muted-foreground/70 transition hover:text-foreground"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          {showConfirmPassword ? (
                            <>
                              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          ) : (
                            <>
                              <path d="M17.5 17.5 6.5 6.5" />
                              <path d="M9.5 9.5A3 3 0 0 0 12 15a3 3 0 0 0 1.5-.4" />
                              <path d="M2 12s2.5-5 10-5c3.5 0 6.5 1.5 8 3.5" />
                              <path d="M22 12s-2.5 5-10 5c-1.5 0-3-.3-4.5-1" />
                              <path d="M8.5 8.5a5 5 0 0 0 6 6" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>
                  <label className="flex items-start gap-2.5 text-[12px] leading-snug text-foreground/80">
                    <input type="checkbox" required className="cbx mt-0.5" />
                    <span>
                      I agree to the{' '}
                      <a href="#" className="font-bold text-primary hover:underline">Terms &amp; Conditions</a> and{' '}
                      <a href="#" className="font-bold text-primary hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-[13.5px] font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Creating account…' : 'Create Account'}
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
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
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
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
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                  Edit details
                </button>

                <h2 className="mt-4 flex items-center gap-2.5 font-display text-[22px] font-bold text-primary sm:text-[26px]">
                  Verify your email
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 6L2 7" />
                  </svg>
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
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                </form>

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
                  <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
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