"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";

const schema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  siteTagline: z.string().optional(),
  siteEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  sitePhone: z.string().optional(),
  siteAddress: z.string().optional(),
  whatsapp: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  ogImage: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SiteSettings {
  siteName: string;
  siteTagline: string | null;
  siteEmail: string | null;
  sitePhone: string | null;
  siteAddress: string | null;
  whatsapp: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  metaTitle: string | null;
  metaDesc: string | null;
  ogImage: string | null;
}

interface Props {
  settings: SiteSettings;
}

function Field({ label, name, register, textarea, placeholder, type = "text" }: {
  label: string;
  name: keyof FormData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  textarea?: boolean;
  placeholder?: string;
  type?: string;
}) {
  const cls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition";
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {textarea
        ? <textarea {...register(name)} rows={3} placeholder={placeholder} className={cls + " resize-none"} />
        : <input type={type} {...register(name)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

export function SettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      siteName: settings.siteName,
      siteTagline: settings.siteTagline ?? "",
      siteEmail: settings.siteEmail ?? "",
      sitePhone: settings.sitePhone ?? "",
      siteAddress: settings.siteAddress ?? "",
      whatsapp: settings.whatsapp ?? "",
      facebook: settings.facebook ?? "",
      instagram: settings.instagram ?? "",
      twitter: settings.twitter ?? "",
      youtube: settings.youtube ?? "",
      metaTitle: settings.metaTitle ?? "",
      metaDesc: settings.metaDesc ?? "",
      ogImage: settings.ogImage ?? "",
    },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        toast.success("Settings saved!");
      } catch {
        toast.error("Failed to save settings.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-3xl">
      {/* General */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-brand-navy text-sm">General</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Field label="Site Name *" name="siteName" register={register} placeholder="Vertex Kashmir Holidays" />
            {errors.siteName && <p className="text-[10px] text-red-500 mt-1">{errors.siteName.message}</p>}
          </div>
          <Field label="Tagline" name="siteTagline" register={register} placeholder="Discover the Paradise" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email" name="siteEmail" register={register} type="email" placeholder="hello@vertexkashmir.com" />
          <Field label="Phone" name="sitePhone" register={register} placeholder="+91 94000 00000" />
        </div>
        <Field label="Address" name="siteAddress" register={register} textarea placeholder="Dal Lake Road, Srinagar, J&K 190001" />
      </div>

      {/* Social */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-brand-navy text-sm">Social Media & Contacts</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="WhatsApp Number" name="whatsapp" register={register} placeholder="+919400000000" />
          <Field label="Facebook URL" name="facebook" register={register} placeholder="https://facebook.com/..." />
          <Field label="Instagram URL" name="instagram" register={register} placeholder="https://instagram.com/..." />
          <Field label="Twitter/X URL" name="twitter" register={register} placeholder="https://twitter.com/..." />
          <Field label="YouTube URL" name="youtube" register={register} placeholder="https://youtube.com/..." />
        </div>
      </div>

      {/* Default SEO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-brand-navy text-sm">Default SEO (used when pages have no meta)</h3>
        <Field label="Default Meta Title" name="metaTitle" register={register} placeholder="Vertex Kashmir Holidays — Premium Kashmir Tours" />
        <Field label="Default Meta Description" name="metaDesc" register={register} textarea placeholder="Discover the paradise of Kashmir..." />
        <Field label="Default OG Image URL" name="ogImage" register={register} placeholder="https://..." />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        Save Settings
      </button>
    </form>
  );
}
