"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Loader2, Images, Trash2, UserCircle, Save } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import type { Role } from "@/lib/rbac";

interface Props {
  initialName: string;
  email: string;
  initialImage: string;
  role: Role;
}

const inputCls =
  "w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function AdminProfileForm({ initialName, email, initialImage, role }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImage(data.url);
      toast.success("Picture uploaded. Save to apply.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    const payload: Record<string, string> = {};
    if (name !== initialName) payload.name = name;
    if (image !== initialImage) payload.image = image;
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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {/* Personal details */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display font-bold text-foreground">Personal details</h2>
        <div className="mt-4 space-y-4">
          {/* Profile picture */}
          <div>
            <label className="text-xs font-semibold text-foreground">Profile picture</label>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="64px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <UserCircle
                    className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground/50"
                    strokeWidth={1.5}
                  />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                >
                  <Images className="h-3.5 w-3.5" /> Gallery
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {image ? "Change" : "Upload"}
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground" htmlFor="ap-name">
                Full name
              </label>
              <input
                id="ap-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground" htmlFor="ap-email">
                Email
              </label>
              <input
                id="ap-email"
                value={email}
                disabled
                className={`${inputCls} cursor-not-allowed bg-muted text-muted-foreground`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground">Role</label>
            <p className="mt-1.5 inline-flex rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {role}
            </p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display font-bold text-foreground">Change password</h2>
        <p className="text-xs text-muted-foreground">
          Enter your current password to set a new one. Leave blank to keep it.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="ap-current">
              Current password
            </label>
            <input
              id="ap-current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputCls}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="ap-new">
              New password
            </label>
            <input
              id="ap-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="ap-confirm">
              Confirm new password
            </label>
            <input
              id="ap-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving…" : "Save changes"}
      </button>

      <GalleryPicker
        open={pickerOpen}
        type="IMAGE"
        onSelect={setImage}
        onClose={() => setPickerOpen(false)}
      />
    </form>
  );
}
