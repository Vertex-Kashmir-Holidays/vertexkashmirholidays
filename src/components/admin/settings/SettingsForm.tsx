"use client";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { parseGstRates } from "@/lib/payments/gst";
import { useState } from "react";

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
 tripadvisor: z.string().optional(),
 googleReviews: z.string().optional(),
 googleBusinessProfile: z.string().optional(),
 googlePlaceId: z.string().optional(),
 tripadvisorHeroWidgetEmbed: z.string().optional(),
 tripadvisorRatingWidgetEmbed: z.string().optional(),
 metaTitle: z.string().optional(),
 metaDesc: z.string().optional(),
 ogImage: z.string().optional(),
 gstRates: z.string().optional(),
 showAnnouncementBanner: z.boolean().optional(),
 announcementMessage: z.string().optional(),
 legalName: z.string().optional(),
 tourismRegNumber: z.string().optional(),
 tourismRegAuthority: z.string().optional(),
 addressLine1: z.string().optional(),
 addressCity: z.string().optional(),
 addressState: z.string().optional(),
 addressPincode: z.string().optional(),
 addressCountry: z.string().optional(),
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
 tripadvisor: string | null;
 googleReviews: string | null;
 googleBusinessProfile: string | null;
 googlePlaceId: string | null;
 tripadvisorHeroWidgetEmbed: string | null;
 tripadvisorRatingWidgetEmbed: string | null;
 metaTitle: string | null;
 metaDesc: string | null;
 ogImage: string | null;
 gstRates: string;
 showAnnouncementBanner: boolean;
 announcementMessage: string | null;
 legalName: string | null;
 tourismRegNumber: string | null;
 tourismRegAuthority: string | null;
 addressLine1: string | null;
 addressCity: string | null;
 addressState: string | null;
 addressPincode: string | null;
 addressCountry: string | null;
}

interface Props {
 settings: SiteSettings;
}

const inputCls =
 "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";

function Field({ label, name, register, textarea, placeholder, type = "text" }: {
 label: string;
 name: keyof FormData;
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 register: any;
 textarea?: boolean;
 placeholder?: string;
 type?: string;
}) {
 return (
   <div>
     <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
     {textarea
       ? <textarea {...register(name)} rows={3} placeholder={placeholder} className={`${inputCls} resize-none`} />
       : <input type={type} {...register(name)} placeholder={placeholder} className={inputCls} />
     }
   </div>
 );
}

export function SettingsForm({ settings }: Props) {
 const [isPending, startTransition] = useTransition();
 const [bannerEnabled, setBannerEnabled] = useState(settings.showAnnouncementBanner);

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
     tripadvisor: settings.tripadvisor ?? "",
     googleReviews: settings.googleReviews ?? "",
     googleBusinessProfile: settings.googleBusinessProfile ?? "",
     googlePlaceId: settings.googlePlaceId ?? "",
     tripadvisorHeroWidgetEmbed: settings.tripadvisorHeroWidgetEmbed ?? "",
     tripadvisorRatingWidgetEmbed: settings.tripadvisorRatingWidgetEmbed ?? "",
     metaTitle: settings.metaTitle ?? "",
     metaDesc: settings.metaDesc ?? "",
     ogImage: settings.ogImage ?? "",
     gstRates: parseGstRates(settings.gstRates).join(", "),
     showAnnouncementBanner: settings.showAnnouncementBanner,
     announcementMessage: settings.announcementMessage ?? "",
     legalName: settings.legalName ?? "",
     tourismRegNumber: settings.tourismRegNumber ?? "",
     tourismRegAuthority: settings.tourismRegAuthority ?? "",
     addressLine1: settings.addressLine1 ?? "",
     addressCity: settings.addressCity ?? "",
     addressState: settings.addressState ?? "",
     addressPincode: settings.addressPincode ?? "",
     addressCountry: settings.addressCountry ?? "",
   },
 });

 function onSubmit(data: FormData) {
   const { gstRates, ...rest } = data;
   const rates = (gstRates ?? "")
     .split(",")
     .map((s) => parseFloat(s.trim()))
     .filter((n) => Number.isFinite(n) && n > 0 && n <= 100);
   const payload = { ...rest, gstRates: rates, showAnnouncementBanner: bannerEnabled };

   startTransition(async () => {
     try {
       const res = await fetch("/api/settings", {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       });
       if (!res.ok) throw new Error();
       toast.success("Settings saved!");
     } catch {
       toast.error("Failed to save settings.");
     }
   });
 }

 return (
   <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
     {/* Two-column grid — left: General + Social, right: Payments + SEO */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

       {/* ── LEFT COLUMN ── */}
       <div className="space-y-6">
         {/* General */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">General</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
               <Field label="Site Name *" name="siteName" register={register} placeholder="Vertex Kashmir Holidays" />
               {errors.siteName && <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">{errors.siteName.message}</p>}
             </div>
             <Field label="Tagline" name="siteTagline" register={register} placeholder="Discover the Paradise" />
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Field label="Email" name="siteEmail" register={register} type="email" placeholder="hello@vertexkashmir.com" />
             <Field label="Phone" name="sitePhone" register={register} placeholder="+91 94000 00000" />
           </div>
           <Field label="Address" name="siteAddress" register={register} textarea placeholder="Dal Lake Road, Srinagar, J&K 190001" />
         </div>

         {/* Legal & Registration — used in JSON-LD, legal pages, and generated PDFs/itineraries */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Legal &amp; Registration</h3>
           <p className="text-[12px] text-muted-foreground -mt-2">
             Official business identity — shown in legal pages, generated PDFs/itineraries, and structured SEO data. Separate from the brand name/address above.
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Field label="Legal Business Name" name="legalName" register={register} placeholder="Vertex Kashmir Tour & Travels" />
             <Field label="Tourism Registration No." name="tourismRegNumber" register={register} placeholder="JKEA00001840" />
           </div>
           <Field label="Registration Issuing Authority" name="tourismRegAuthority" register={register} placeholder="e.g. Department of Tourism, Government of Jammu & Kashmir" />
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Field label="Address Line 1" name="addressLine1" register={register} placeholder="Katipora, Tangmarg" />
             <Field label="City / District" name="addressCity" register={register} placeholder="Baramulla" />
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <Field label="State" name="addressState" register={register} placeholder="Jammu & Kashmir" />
             <Field label="Pincode" name="addressPincode" register={register} placeholder="193402" />
             <Field label="Country" name="addressCountry" register={register} placeholder="India" />
           </div>
         </div>

         {/* Social Media & Contacts */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Social Media &amp; Contacts</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Field label="WhatsApp Number" name="whatsapp" register={register} placeholder="+919400000000" />
             <Field label="Facebook URL" name="facebook" register={register} placeholder="https://facebook.com/..." />
             <Field label="Instagram URL" name="instagram" register={register} placeholder="https://instagram.com/..." />
             <Field label="Twitter/X URL" name="twitter" register={register} placeholder="https://twitter.com/..." />
             <Field label="YouTube URL" name="youtube" register={register} placeholder="https://youtube.com/..." />
             <Field label="Tripadvisor URL" name="tripadvisor" register={register} placeholder="https://www.tripadvisor.in/..." />
             <Field label="Google Reviews Link" name="googleReviews" register={register} placeholder="https://g.page/r/... or share link" />
             <Field
               label="Google Business Profile / Maps URL"
               name="googleBusinessProfile"
               register={register}
               placeholder="https://maps.app.goo.gl/... or Google Maps listing URL"
             />
           </div>
           <p className="text-[12px] text-muted-foreground -mt-2">
             The canonical Google Maps/Business Profile listing URL — distinct from the reviews link above. Used to
             connect your website to your existing Business Profile in Google&apos;s structured data.
           </p>
         </div>

         {/* Live Reviews Integration (/reviews page) */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Live Reviews Integration</h3>
           <p className="text-xs text-muted-foreground -mt-2">
             Powers the live Google &amp; Tripadvisor sections on the /reviews page.
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Field
               label="Google Place ID"
               name="googlePlaceId"
               register={register}
               placeholder="ChIJ..."
             />
           </div>
           <p className="text-[12px] text-muted-foreground -mt-2">
             Find this with Google&apos;s{" "}
             <a
               href="https://developers.google.com/maps/documentation/places/web-service/place-id"
               target="_blank"
               rel="noopener noreferrer"
               className="underline hover:text-primary"
             >
               Place ID Finder
             </a>
             . Requires <code className="rounded bg-muted px-1">GOOGLE_PLACES_API_KEY</code> to be set on the server.
           </p>
           <Field
             label="Tripadvisor hero widget embed code"
             name="tripadvisorHeroWidgetEmbed"
             register={register}
             textarea
             placeholder="Paste a compact Tripadvisor widget (e.g. Social Button Bubbles) for the reviews page hero..."
           />
           <Field
             label="Tripadvisor rating widget embed code"
             name="tripadvisorRatingWidgetEmbed"
             register={register}
             textarea
             placeholder="Paste a rating-only Tripadvisor widget (e.g. Ratings Only Narrow) for the stats row..."
           />
         </div>
       </div>

       {/* ── RIGHT COLUMN ── */}
       <div className="space-y-6">
         {/* Payments / GST */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Payments</h3>
           <Field label="GST Rate Options (%)" name="gstRates" register={register} placeholder="5, 16, 18" />
           <p className="text-[12px] text-muted-foreground -mt-2">
             Comma-separated percentages offered when recording non-cash payments. Leave blank to use the defaults (5, 16, 18). GST never applies to cash payments.
           </p>
         </div>

         {/* Default SEO */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Default SEO</h3>
           <p className="text-[12px] text-muted-foreground -mt-2">Used when pages have no meta set.</p>
           <Field label="Default Meta Title" name="metaTitle" register={register} placeholder="Vertex Kashmir Holidays — Premium Kashmir Tours" />
           <Field label="Default Meta Description" name="metaDesc" register={register} textarea placeholder="Discover the paradise of Kashmir..." />
           <Field label="Default OG Image URL" name="ogImage" register={register} placeholder="https://..." />
         </div>
       </div>
     </div>

     {/* Announcement Banner */}
     <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
       <div className="flex items-center justify-between gap-4">
         <div>
           <h3 className="font-bold text-foreground text-sm">Announcement Banner</h3>
           <p className="text-[12px] text-muted-foreground mt-0.5">
             Shows a modal popup to visitors after 30 seconds. Once dismissed it won&apos;t reappear in the same session.
           </p>
         </div>
         {/* Toggle */}
         <button
           type="button"
           onClick={() => setBannerEnabled((v) => !v)}
           className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${bannerEnabled ? "bg-emerald-500" : "bg-muted"}`}
           role="switch"
           aria-checked={bannerEnabled}
         >
           <span
             className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${bannerEnabled ? "translate-x-5" : "translate-x-0"}`}
           />
         </button>
       </div>
       {bannerEnabled && (
         <div>
           <label className="block text-xs font-semibold text-muted-foreground mb-1">
             Banner Message
           </label>
           <textarea
             {...register("announcementMessage")}
             rows={3}
             placeholder="We're adding new tours. Contact us for a custom itinerary tailored just for you!"
             className={`${inputCls} resize-none`}
           />
           <p className="text-[12px] text-muted-foreground mt-1">
             Leave blank to use the default message.
           </p>
         </div>
       )}
     </div>

     {/* CTA — centered below both columns */}
     <div className="flex justify-center pt-2">
       <button
         type="submit"
         disabled={isPending}
         className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
       >
         {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
         Save Settings
       </button>
     </div>
   </form>
 );
}
