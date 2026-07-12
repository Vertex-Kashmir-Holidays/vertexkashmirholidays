"use client";


import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload, Images, Plus, Trash2 } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import { LinkChecklist, type LinkOption } from "@/components/admin/activities/LinkChecklist";
import { stringifyList } from "@/lib/tours/content";


const listItemSchema = z.object({ value: z.string() });
const topAttractionItemSchema = z.object({ name: z.string().default(""), description: z.string().default("") });
const foodOrShopItemSchema = z.object({ name: z.string().default(""), description: z.string().default("") });

const schema = z.object({
 name: z.string().min(2, "Name is required"),
 slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
 location: z.string().optional(),
 excerpt: z.string().optional(),
 description: z.string().optional(),
 coverImage: z.string().optional(),
 coverImageMobile: z.string().optional(),
 altitude: z.string().optional(),
 season: z.string().optional(),
 region: z.string().optional(),
 latitude: z.string().regex(/^-?\d*\.?\d*$/, "Numbers only").optional(),
 longitude: z.string().regex(/^-?\d*\.?\d*$/, "Numbers only").optional(),
 whyVisit: z.array(listItemSchema).default([]),
 topAttractions: z.array(topAttractionItemSchema).default([]),
 bestTimeDetail: z.string().optional(),
 howToReach: z.string().optional(),
 whereToStay: z.string().optional(),
 localFood: z.array(foodOrShopItemSchema).default([]),
 shopping: z.array(foodOrShopItemSchema).default([]),
 travelTips: z.array(listItemSchema).default([]),
 metaTitle: z.string().optional(),
 metaDesc: z.string().optional(),
 ogImage: z.string().optional(),
 ogTitle: z.string().optional(),
 ogDescription: z.string().optional(),
});


type FormData = z.infer<typeof schema>;


export interface DestinationFormDefaults {
 id?: string;
 name?: string;
 slug?: string;
 location?: string;
 excerpt?: string;
 description?: string;
 coverImage?: string;
 coverImageMobile?: string;
 altitude?: string;
 season?: string;
 region?: string;
 latitude?: string;
 longitude?: string;
 whyVisit?: string[];
 topAttractions?: { name: string; description: string }[];
 bestTimeDetail?: string;
 howToReach?: string;
 whereToStay?: string;
 localFood?: { name: string; description: string }[];
 shopping?: { name: string; description: string }[];
 travelTips?: string[];
 metaTitle?: string;
 metaDesc?: string;
 ogImage?: string;
 ogTitle?: string;
 ogDescription?: string;
 activityIds?: string[];
 relatedBlogIds?: string[];
}

interface Props {
 defaults?: DestinationFormDefaults;
 activityOptions?: LinkOption[];
 blogOptions?: LinkOption[];
}


function slugify(s: string) {
 return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}


const inputCls =
 "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";


export function DestinationForm({ defaults, activityOptions = [], blogOptions = [] }: Props) {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const [uploading, setUploading] = useState(false);
 const [picker, setPicker] = useState<"coverImage" | "coverImageMobile" | "ogImage" | null>(null);
 const [activityIds, setActivityIds] = useState<string[]>(defaults?.activityIds ?? []);
 const [relatedBlogIds, setRelatedBlogIds] = useState<string[]>(defaults?.relatedBlogIds ?? []);
 const isEdit = !!defaults?.id;


 const {
   register,
   control,
   handleSubmit,
   setValue,
   watch,
   formState: { errors },
 } = useForm<FormData>({
   resolver: zodResolver(schema) as any,
   defaultValues: {
     name: defaults?.name ?? "",
     slug: defaults?.slug ?? "",
     location: defaults?.location ?? "",
     excerpt: defaults?.excerpt ?? "",
     description: defaults?.description ?? "",
     coverImage: defaults?.coverImage ?? "",
     coverImageMobile: defaults?.coverImageMobile ?? "",
     altitude: defaults?.altitude ?? "",
     season: defaults?.season ?? "",
     region: defaults?.region ?? "",
     latitude: defaults?.latitude ?? "",
     longitude: defaults?.longitude ?? "",
     whyVisit: (defaults?.whyVisit ?? []).map((v) => ({ value: v })),
     topAttractions: (defaults?.topAttractions ?? []).map((a) => ({ name: a.name, description: a.description })),
     bestTimeDetail: defaults?.bestTimeDetail ?? "",
     howToReach: defaults?.howToReach ?? "",
     whereToStay: defaults?.whereToStay ?? "",
     localFood: (defaults?.localFood ?? []).map((f) => ({ name: f.name, description: f.description })),
     shopping: (defaults?.shopping ?? []).map((s) => ({ name: s.name, description: s.description })),
     travelTips: (defaults?.travelTips ?? []).map((v) => ({ value: v })),
     metaTitle: defaults?.metaTitle ?? "",
     metaDesc: defaults?.metaDesc ?? "",
     ogImage: defaults?.ogImage ?? "",
     ogTitle: defaults?.ogTitle ?? "",
     ogDescription: defaults?.ogDescription ?? "",
   },
 });


 const { fields: whyVisitFields, append: addWhyVisit, remove: removeWhyVisit } = useFieldArray({ control, name: "whyVisit" });
 const { fields: attractionFields, append: addAttraction, remove: removeAttraction } = useFieldArray({ control, name: "topAttractions" });
 const { fields: foodFields, append: addFood, remove: removeFood } = useFieldArray({ control, name: "localFood" });
 const { fields: shopFields, append: addShop, remove: removeShop } = useFieldArray({ control, name: "shopping" });
 const { fields: tipFields, append: addTip, remove: removeTip } = useFieldArray({ control, name: "travelTips" });


 const nameVal = watch("name");
 useEffect(() => {
   if (!isEdit && nameVal) setValue("slug", slugify(nameVal));
 }, [nameVal, isEdit, setValue]);


 const coverImage = watch("coverImage");
 const coverImageMobile = watch("coverImageMobile");


 async function uploadFile(file: File, field: "coverImage" | "coverImageMobile" | "ogImage") {
   setUploading(true);
   try {
     const fd = new FormData();
     fd.append("file", file);
     fd.append("folder", "destinations");
     const res = await fetch("/api/uploads", { method: "POST", body: fd });
     if (!res.ok) throw new Error("Upload failed");
     const data = await res.json() as { url: string };
     setValue(field, data.url);
     toast.success("Image uploaded.");
   } catch {
     toast.error("Upload failed.");
   } finally {
     setUploading(false);
   }
 }


 function onSubmit(data: FormData) {
   const { whyVisit, topAttractions, localFood, shopping, travelTips, ...rest } = data;
   const payload = {
     ...rest,
     whyVisit: stringifyList(whyVisit.map((v) => v.value).filter(Boolean)),
     topAttractions: stringifyList(topAttractions.filter((a) => a.name.trim() || a.description.trim())),
     localFood: stringifyList(localFood.filter((f) => f.name.trim() || f.description.trim())),
     shopping: stringifyList(shopping.filter((s) => s.name.trim() || s.description.trim())),
     travelTips: stringifyList(travelTips.map((v) => v.value).filter(Boolean)),
     activityIds,
     relatedBlogIds: stringifyList(relatedBlogIds),
   };
   startTransition(async () => {
     try {
       const url = isEdit ? `/api/destinations/${defaults!.id}` : "/api/destinations";
       const method = isEdit ? "PATCH" : "POST";
       const res = await fetch(url, {
         method,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       });
       if (!res.ok) {
         if (res.status === 403) {
           toast.error("You don't have permission to save destinations. Contact your administrator.");
           return;
         }
         const err = await res.json() as { error?: string | { fieldErrors?: Record<string, string[]> } };
         const msg = typeof err.error === "string" ? err.error : "Save failed";
         toast.error(msg);
         return;
       }
       toast.success(isEdit ? "Destination updated!" : "Destination created!");
       router.push("/admin/destinations");
       router.refresh();
     } catch {
       toast.error("An error occurred.");
     }
   });
 }


 return (
   <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
     {/* Two-column grid — left: Basic Info + Facts, right: Cover + Activities + SEO */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">


       {/* ── LEFT COLUMN ── */}
       <div className="space-y-6">
         {/* Basic Information */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Basic Information</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Name *</label>
               <input {...register("name")} className={inputCls} placeholder="e.g. Dal Lake" />
               {errors.name && <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>}
             </div>
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Slug *</label>
               <input {...register("slug")} className={`${inputCls} font-mono`} placeholder="e.g. dal-lake" />
               {errors.slug && <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">{errors.slug.message}</p>}
             </div>
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">Location</label>
             <input {...register("location")} className={inputCls} placeholder="e.g. Srinagar, Kashmir" />
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">Excerpt</label>
             <textarea {...register("excerpt")} rows={2} className={`${inputCls} resize-none`} placeholder="Short description for listing cards..." />
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
             <textarea {...register("description")} rows={5} className={`${inputCls} resize-none`} placeholder="Full destination description..." />
           </div>
         </div>


         {/* Facts & Coordinates */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div>
             <h3 className="font-bold text-foreground text-sm">Facts &amp; Coordinates</h3>
             <p className="text-[12px] text-muted-foreground mt-0.5">Shown on destination cards &amp; detail page. Coordinates power the live weather widget.</p>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Altitude</label>
               <input {...register("altitude")} className={inputCls} placeholder="e.g. 2,650 m" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Best Season</label>
               <input {...register("season")} className={inputCls} placeholder="e.g. Apr – Oct" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Region</label>
               <input {...register("region")} className={inputCls} placeholder="e.g. Kashmir Valley" />
             </div>
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Latitude</label>
               <input {...register("latitude")} inputMode="decimal" className={`${inputCls} font-mono`} placeholder="e.g. 34.0500" />
               {errors.latitude && <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">{errors.latitude.message}</p>}
             </div>
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Longitude</label>
               <input {...register("longitude")} inputMode="decimal" className={`${inputCls} font-mono`} placeholder="e.g. 74.3800" />
               {errors.longitude && <p className="text-[12px] text-red-500 dark:text-red-400 mt-1">{errors.longitude.message}</p>}
             </div>
           </div>
         </div>


         {/* Cover Image */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Cover Image</h3>
           <div className="flex gap-3">
             <input
               {...register("coverImage")}
               className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
               placeholder="https://... or /uploads/..."
             />
             <button
               type="button"
               onClick={() => setPicker("coverImage")}
               className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
             >
               <Images className="w-3.5 h-3.5" />
               Gallery
             </button>
             <label className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:border-primary hover:text-primary"}`}>
               {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
               Upload
               <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "coverImage")} />
             </label>
           </div>
           {coverImage && (
             <div className="relative h-40 rounded-xl overflow-hidden bg-muted">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
             </div>
           )}
         </div>


         {/* Cover Image (Mobile) */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div>
             <h3 className="font-bold text-foreground text-sm">Cover Image (Mobile)</h3>
             <p className="text-[12px] text-muted-foreground mt-0.5">Shown on phones instead of the desktop Cover Image. Leave blank to reuse the desktop image.</p>
           </div>
           <div className="flex gap-3">
             <input
               {...register("coverImageMobile")}
               className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
               placeholder="https://... or /uploads/..."
             />
             <button
               type="button"
               onClick={() => setPicker("coverImageMobile")}
               className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
             >
               <Images className="w-3.5 h-3.5" />
               Gallery
             </button>
             <label className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border cursor-pointer transition-colors ${uploading ? "opacity-50" : "hover:border-primary hover:text-primary"}`}>
               {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
               Upload
               <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "coverImageMobile")} />
             </label>
           </div>
           {coverImageMobile && (
             <div className="relative h-40 w-40 mx-auto rounded-xl overflow-hidden bg-muted">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={coverImageMobile} alt="Mobile cover preview" className="w-full h-full object-cover" />
             </div>
           )}
         </div>


         {/* Why Visit */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-bold text-foreground text-sm">Why Visit</h3>
             <button type="button" onClick={() => addWhyVisit({ value: "" })} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
               <Plus className="w-3.5 h-3.5" /> Add Reason
             </button>
           </div>
           <div className="space-y-2">
             {whyVisitFields.map((field, i) => (
               <div key={field.id} className="flex gap-2 items-center">
                 <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                 <input {...register(`whyVisit.${i}.value`)} className={`${inputCls} flex-1`} placeholder="e.g. Alpine meadows blooming with wildflowers in spring" />
                 <button type="button" onClick={() => removeWhyVisit(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {whyVisitFields.length === 0 && <p className="text-xs text-muted-foreground py-2">No reasons added yet.</p>}
           </div>
         </div>


         {/* Top Attractions */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-bold text-foreground text-sm">Top Attractions</h3>
             <button type="button" onClick={() => addAttraction({ name: "", description: "" })} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
               <Plus className="w-3.5 h-3.5" /> Add Attraction
             </button>
           </div>
           {attractionFields.length === 0 ? (
             <p className="text-xs text-muted-foreground py-2">No attractions added yet.</p>
           ) : (
             <div className="space-y-3">
               {attractionFields.map((field, i) => (
                 <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50 flex items-start gap-3">
                   <div className="flex-1 space-y-2">
                     <input {...register(`topAttractions.${i}.name`)} className={inputCls} placeholder="Attraction name — e.g. Betaab Valley" />
                     <textarea {...register(`topAttractions.${i}.description`)} rows={2} className={`${inputCls} resize-none`} placeholder="Short description..." />
                   </div>
                   <button type="button" onClick={() => removeAttraction(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0 mt-2.5">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
           )}
         </div>


         {/* Best Time / How to Reach / Where to Stay */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">Planning Detail</h3>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">Best Time to Visit — Detail</label>
             <p className="text-[12px] text-muted-foreground mb-1">HTML is accepted. Full seasonal breakdown — the short Best Season field above stays for the sidebar quick-fact.</p>
             <textarea {...register("bestTimeDetail")} rows={4} className={`${inputCls} resize-none`} placeholder="Season-by-season breakdown..." />
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">How to Reach</label>
             <p className="text-[12px] text-muted-foreground mb-1">HTML is accepted.</p>
             <textarea {...register("howToReach")} rows={4} className={`${inputCls} resize-none`} placeholder="Air / road / rail directions..." />
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">Where to Stay</label>
             <p className="text-[12px] text-muted-foreground mb-1">HTML is accepted.</p>
             <textarea {...register("whereToStay")} rows={4} className={`${inputCls} resize-none`} placeholder="Hotel / stay category guidance..." />
           </div>
         </div>


         {/* Local Food */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-bold text-foreground text-sm">Local Food</h3>
             <button type="button" onClick={() => addFood({ name: "", description: "" })} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
               <Plus className="w-3.5 h-3.5" /> Add Item
             </button>
           </div>
           {foodFields.length === 0 ? (
             <p className="text-xs text-muted-foreground py-2">No local food items yet.</p>
           ) : (
             <div className="space-y-3">
               {foodFields.map((field, i) => (
                 <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50 flex items-start gap-3">
                   <div className="flex-1 space-y-2">
                     <input {...register(`localFood.${i}.name`)} className={inputCls} placeholder="Dish / place — e.g. Wazwan" />
                     <textarea {...register(`localFood.${i}.description`)} rows={2} className={`${inputCls} resize-none`} placeholder="Short description..." />
                   </div>
                   <button type="button" onClick={() => removeFood(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0 mt-2.5">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
           )}
         </div>


         {/* Shopping */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-bold text-foreground text-sm">Shopping</h3>
             <button type="button" onClick={() => addShop({ name: "", description: "" })} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
               <Plus className="w-3.5 h-3.5" /> Add Item
             </button>
           </div>
           {shopFields.length === 0 ? (
             <p className="text-xs text-muted-foreground py-2">No shopping items yet.</p>
           ) : (
             <div className="space-y-3">
               {shopFields.map((field, i) => (
                 <div key={field.id} className="border border-border rounded-xl p-4 bg-muted/50 flex items-start gap-3">
                   <div className="flex-1 space-y-2">
                     <input {...register(`shopping.${i}.name`)} className={inputCls} placeholder="Item / market — e.g. Pashmina shawls" />
                     <textarea {...register(`shopping.${i}.description`)} rows={2} className={`${inputCls} resize-none`} placeholder="Short description..." />
                   </div>
                   <button type="button" onClick={() => removeShop(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0 mt-2.5">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ))}
             </div>
           )}
         </div>


         {/* Travel Tips */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div className="flex items-center justify-between">
             <h3 className="font-bold text-foreground text-sm">Travel Tips</h3>
             <button type="button" onClick={() => addTip({ value: "" })} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
               <Plus className="w-3.5 h-3.5" /> Add Tip
             </button>
           </div>
           <div className="space-y-2">
             {tipFields.map((field, i) => (
               <div key={field.id} className="flex gap-2 items-center">
                 <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-[12px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                 <input {...register(`travelTips.${i}.value`)} className={`${inputCls} flex-1`} placeholder="e.g. Carry a postpaid SIM — prepaid connections don't work in J&K" />
                 <button type="button" onClick={() => removeTip(i)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             ))}
             {tipFields.length === 0 && <p className="text-xs text-muted-foreground py-2">No tips added yet.</p>}
           </div>
         </div>
       </div>


       {/* ── RIGHT COLUMN ── */}
       <div className="space-y-6">
         {/* Linked Activities */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div>
             <h3 className="font-bold text-foreground text-sm">Things to Do</h3>
             <p className="text-[12px] text-muted-foreground mt-0.5">Activities shown on this destination&apos;s page. Manage activities in the Activities module.</p>
           </div>
           <LinkChecklist title="Activities" options={activityOptions} value={activityIds} onChange={setActivityIds} />
         </div>


         {/* Related Blogs */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div>
             <h3 className="font-bold text-foreground text-sm">Related Blogs</h3>
             <p className="text-[12px] text-muted-foreground mt-0.5">Curated editorial links shown at the end of this destination&apos;s page. Not an automatic feed — manage blog posts in the Blogs module.</p>
           </div>
           <LinkChecklist title="Blog Posts" options={blogOptions} value={relatedBlogIds} onChange={setRelatedBlogIds} />
         </div>


         {/* SEO */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <h3 className="font-bold text-foreground text-sm">SEO</h3>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">Meta Title</label>
             <input {...register("metaTitle")} className={inputCls} />
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">Meta Description</label>
             <textarea {...register("metaDesc")} rows={2} className={`${inputCls} resize-none`} />
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">OG Image URL</label>
             <div className="flex gap-3">
               <input {...register("ogImage")} className="flex-1 px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition" />
               <button
                 type="button"
                 onClick={() => setPicker("ogImage")}
                 className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
               >
                 <Images className="w-3.5 h-3.5" />
                 Gallery
               </button>
             </div>
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">OG Title</label>
             <p className="text-[12px] text-muted-foreground mb-1">Overrides Meta Title for social shares. Leave blank to reuse Meta Title.</p>
             <input {...register("ogTitle")} className={inputCls} />
           </div>
           <div>
             <label className="block text-xs font-semibold text-muted-foreground mb-1">OG Description</label>
             <p className="text-[12px] text-muted-foreground mb-1">Overrides Meta Description for social shares. Leave blank to reuse Meta Description.</p>
             <textarea {...register("ogDescription")} rows={2} className={`${inputCls} resize-none`} />
           </div>
         </div>
       </div>
     </div>


     {/* CTA — centered below both columns */}
     <div className="flex items-center justify-center gap-3 pt-2">
       <button
         type="submit"
         disabled={isPending || uploading}
         className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
       >
         {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
         {isEdit ? "Save Changes" : "Create Destination"}
       </button>
       <button
         type="button"
         onClick={() => router.push("/admin/destinations")}
         className="text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl border border-border transition-colors"
       >
         Cancel
       </button>
     </div>


     <GalleryPicker
       open={picker !== null}
       type="IMAGE"
       onSelect={(url) => picker && setValue(picker, url)}
       onClose={() => setPicker(null)}
     />
   </form>
 );
}
