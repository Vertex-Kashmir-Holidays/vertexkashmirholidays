"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { totpCodeSchema, recoveryCodeSchema } from "@/lib/security/mfaValidation";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function MfaChallengeForm() {
  const { update } = useSession();
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const schema = useMemo(
    () => z.object({ code: useRecoveryCode ? recoveryCodeSchema : totpCodeSchema }),
    [useRecoveryCode],
  );
  type Values = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    resetField,
    formState: { isValid },
  } = useForm<Values>({ resolver: zodResolver(schema), mode: "onChange" });

  async function onSubmit({ code }: Values) {
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Incorrect code. Please try again.");
        setVerifying(false);
        return;
      }

      // Same reason as the forced-password-change flow: a hard reload ensures
      // the middleware sees the refreshed JWT immediately.
      await update({ mfaPending: false });
      window.location.assign("/admin/dashboard");
    } catch {
      setVerifying(false);
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="font-display font-bold text-foreground">
            {useRecoveryCode ? "Enter a recovery code" : "Enter your code"}
          </h2>
        </div>
        <div>
          <label className="text-xs font-semibold text-foreground" htmlFor="mfa-challenge-code">
            {useRecoveryCode ? "Recovery code" : "6-digit code"}
          </label>
          <input
            id="mfa-challenge-code"
            inputMode={useRecoveryCode ? "text" : "numeric"}
            autoComplete="one-time-code"
            maxLength={useRecoveryCode ? 14 : 6}
            className={`${inputClass} text-center tracking-[0.3em]`}
            placeholder={useRecoveryCode ? "XXXX-XXXX-XXXX" : "------"}
            autoFocus
            {...register("code", {
              onChange: (e) => {
                e.target.value = useRecoveryCode
                  ? e.target.value.toUpperCase().slice(0, 14)
                  : e.target.value.replace(/\D/g, "").slice(0, 6);
              },
            })}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setUseRecoveryCode((v) => !v);
            resetField("code", { defaultValue: "" });
          }}
          className="mt-3 text-xs font-semibold text-primary hover:underline"
        >
          {useRecoveryCode ? "Use your authenticator app instead" : "Use a recovery code instead"}
        </button>
      </div>
      <button
        type="submit"
        disabled={verifying || !isValid}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
        Verify &amp; continue
      </button>
    </form>
  );
}
