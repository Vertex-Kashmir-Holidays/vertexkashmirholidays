"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

type Step = "loading" | "scan" | "recovery";

export function MfaEnrollForm() {
  const { update } = useSession();
  const [step, setStep] = useState<Step>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [manualKey, setManualKey] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/admin/mfa/enroll", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (cancelled) return;
      if (!res.ok) {
        toast.error(data.error ?? "Could not start setup. Please refresh and try again.");
        return;
      }
      setQrDataUrl(data.qrDataUrl);
      setManualKey(data.manualKey);
      setStep("scan");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Incorrect code. Please try again.");
        return;
      }
      setRecoveryCodes(data.recoveryCodes);
      setStep("recovery");
    } finally {
      setVerifying(false);
    }
  }

  async function copyRecoveryCodes() {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFinish() {
    setFinishing(true);
    try {
      // Same reason as the forced-password-change flow: a hard reload ensures
      // the middleware sees the refreshed JWT immediately, instead of a soft
      // navigation leaving it looking at a stale token.
      await update({ mfaPending: false });
      window.location.assign("/admin/dashboard");
    } catch {
      setFinishing(false);
      toast.error("Something went wrong. Please try again.");
    }
  }

  if (step === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparing setup…
      </div>
    );
  }

  if (step === "scan") {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="font-display font-bold text-foreground">Scan with your authenticator app</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Use Google Authenticator, Authy, or any TOTP app. Can&apos;t scan?
            Enter this key manually:
          </p>
          {qrDataUrl && (
            <div className="mt-4 flex justify-center">
              {/* Locally-generated data: URI, not a remote/user-controlled URL —
                  next/image's optimizer/remotePatterns don't apply here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="Scan this QR code with your authenticator app"
                width={200}
                height={200}
                className="rounded-lg border border-border"
              />
            </div>
          )}
          <p className="mt-3 break-all rounded-lg bg-muted px-3 py-2 text-center font-mono text-xs">
            {manualKey}
          </p>
          <div className="mt-5">
            <label className="text-xs font-semibold text-foreground" htmlFor="mfa-code">
              6-digit code
            </label>
            <input
              id="mfa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${inputClass} text-center tracking-[0.4em]`}
              placeholder="------"
              autoFocus
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={verifying || code.length !== 6}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
          Verify &amp; enable
        </button>
      </form>
    );
  }

  // step === "recovery"
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="font-display font-bold text-foreground">Save your recovery codes</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Each code can be used once to sign in if you lose access to your authenticator
          app. Save these somewhere safe — they will not be shown again.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 font-mono text-xs">
          {recoveryCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={copyRecoveryCodes}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy all codes"}
        </button>
        <label className="mt-4 flex items-start gap-2.5 text-xs text-foreground/80">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={savedConfirmed}
            onChange={(e) => setSavedConfirmed(e.target.checked)}
          />
          I&apos;ve saved these recovery codes somewhere safe.
        </label>
      </div>
      <button
        type="button"
        onClick={handleFinish}
        disabled={!savedConfirmed || finishing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {finishing && <Loader2 className="h-4 w-4 animate-spin" />}
        Continue to dashboard
      </button>
    </div>
  );
}
