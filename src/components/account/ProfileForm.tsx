"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Upload, Loader2, UserCircle, Trash2 } from "lucide-react";
import { profileFormSchema, type ProfileFormValues } from "@/lib/account/profileSchema";

interface Props {
  initialName: string;
  email: string;
  initialImage: string;
}

export function ProfileForm({ initialName, email, initialImage }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    resetField,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: {
      name: initialName,
      image: initialImage,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const image = watch("image");

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setValue("image", data.url, { shouldDirty: true });
      toast.success("Picture uploaded. Save to apply.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(data: ProfileFormValues) {
    const payload: Record<string, string> = {};
    if (dirtyFields.name) payload.name = data.name;
    if (dirtyFields.image) payload.image = data.image ?? "";
    if (data.newPassword) {
      payload.currentPassword = data.currentPassword ?? "";
      payload.newPassword = data.newPassword;
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
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resData.error);

      toast.success("Profile updated.");
      resetField("currentPassword");
      resetField("newPassword");
      resetField("confirmPassword");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
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
                    className="object-cover"
                    unoptimized
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
                    onClick={() => setValue("image", "", { shouldDirty: true })}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
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
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              JPG or PNG, up to 5 MB. Shown on your reviews.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="pf-name">
              Full name
            </label>
            <input
              id="pf-name"
              className={inputClass}
              placeholder="Your name"
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-[12px] text-rose-500">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="pf-email">
              Email
            </label>
            <input
              id="pf-email"
              value={email}
              disabled
              className={`${inputClass} cursor-not-allowed bg-muted text-muted-foreground`}
            />
            <p className="mt-1 text-[12px] text-muted-foreground">Email can&apos;t be changed.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display font-bold text-foreground">Change password</h2>
        <p className="text-xs text-muted-foreground">Leave blank to keep your current password.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="pf-current">
              Current password
            </label>
            <input
              id="pf-current"
              type="password"
              className={inputClass}
              autoComplete="current-password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-[12px] text-rose-500">{errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="pf-new">
              New password
            </label>
            <input
              id="pf-new"
              type="password"
              className={inputClass}
              autoComplete="new-password"
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="mt-1 text-[12px] text-rose-500">{errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground" htmlFor="pf-confirm">
              Confirm new password
            </label>
            <input
              id="pf-confirm"
              type="password"
              className={inputClass}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-[12px] text-rose-500">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
