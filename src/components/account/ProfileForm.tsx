"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  initialName: string;
  email: string;
}

export function ProfileForm({ initialName, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    const payload: Record<string, string> = {};
    if (name !== initialName) payload.name = name;
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("Nothing to update.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);

      toast.success("Profile updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-brand-line bg-white px-3.5 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/25";

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-brand-line bg-white p-5">
        <h2 className="font-display font-bold text-brand-navy">Personal details</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-brand-ink" htmlFor="pf-name">Full name</label>
            <input
              id="pf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-ink" htmlFor="pf-email">Email</label>
            <input id="pf-email" value={email} disabled className={`${inputClass} cursor-not-allowed bg-brand-page text-brand-mute`} />
            <p className="mt-1 text-[11px] text-brand-mute">Email can&apos;t be changed.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-line bg-white p-5">
        <h2 className="font-display font-bold text-brand-navy">Change password</h2>
        <p className="text-xs text-brand-mute">Leave blank to keep your current password.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-brand-ink" htmlFor="pf-current">Current password</label>
            <input
              id="pf-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-ink" htmlFor="pf-new">New password</label>
            <input
              id="pf-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-brand-ink" htmlFor="pf-confirm">Confirm new password</label>
            <input
              id="pf-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-brand-green px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
