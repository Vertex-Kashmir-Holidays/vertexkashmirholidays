"use client";


import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, Upload, Images } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import { LinkChecklist, type LinkOption } from "@/components/admin/activities/LinkChecklist";


const schema = z.object({
 name: z.string().min(2, "Name is required"),
 slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug: lowercase, numbers, hyphens only"),
 location: z.string().optional(),
 excerpt: z.string().optional(),
 description: z.string().optional(),
 coverImage: z.string().optional(),
 altitude: z.string().optional(),
 season: z.string().optional(),
 region: z.string().optional(),
 latitude: z.string().regex(/^-?\d*\.?\d*$/, "Numbers only").optional(),
 longitude: z.string().regex(/^-?\d*\.?\d*$/, "Numbers only").optional(),
 metaTitle: z.string().optional(),
 metaDesc: z.string().optional(),
 ogImage: z.string().optional(),
});


type FormData = z.infer<typeof schema>;


interface Props {
 defaults?: Partial<FormData> & { id?: string; activityIds?: string[] };
 activityOptions?: LinkOption[];
}


function slugify(s: string) {
 return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}


const inputCls =
 "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition";


export function DestinationForm({ defaults, activityOptions = [] }: Props) {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const [uploading, setUploading] = useState(false);
 const [picker, setPicker] = useState<"coverImage" | "ogImage" | null>(null);
 const [activityIds, setActivityIds] = useState<string[]>(defaults?.activityIds ?? []);
 const isEdit = !!defaults?.id;


 const {
   register,
   handleSubmit,
   setValue,
   watch,
   formState: { errors },
 } = useForm<FormData>({
   resolver: zodResolver(schema),
   defaultValues: {
     name: defaults?.name ?? "",
     slug: defaults?.slug ?? "",
     location: defaults?.location ?? "",
     excerpt: defaults?.excerpt ?? "",
     description: defaults?.description ?? "",
     coverImage: defaults?.coverImage ?? "",
     altitude: defaults?.altitude ?? "",
     season: defaults?.season ?? "",
     region: defaults?.region ?? "",
     latitude: defaults?.latitude ?? "",
     longitude: defaults?.longitude ?? "",
     metaTitle: defaults?.metaTitle ?? "",
     metaDesc: defaults?.metaDesc ?? "",
     ogImage: defaults?.ogImage ?? "",
   },
 });


 const nameVal = watch("name");
 useEffect(() => {
   if (!isEdit && nameVal) setValue("slug", slugify(nameVal));
 }, [nameVal, isEdit, setValue]);


 const coverImage = watch("coverImage");


 async function uploadFile(file: File, field: "coverImage" | "ogImage") {
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
   startTransition(async () => {
     try {
       const url = isEdit ? `/api/destinations/${defaults!.id}` : "/api/destinations";
       const method = isEdit ? "PATCH" : "POST";
       const res = await fetch(url, {
         method,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ ...data, activityIds }),
       });
       if (!res.ok) {
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
               {errors.name && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.name.message}</p>}
             </div>
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Slug *</label>
               <input {...register("slug")} className={`${inputCls} font-mono`} placeholder="e.g. dal-lake" />
               {errors.slug && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.slug.message}</p>}
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
             <p className="text-[11px] text-muted-foreground mt-0.5">Shown on destination cards &amp; detail page. Coordinates power the live weather widget.</p>
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
               {errors.latitude && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.latitude.message}</p>}
             </div>
             <div>
               <label className="block text-xs font-semibold text-muted-foreground mb-1">Longitude</label>
               <input {...register("longitude")} inputMode="decimal" className={`${inputCls} font-mono`} placeholder="e.g. 74.3800" />
               {errors.longitude && <p className="text-[10px] text-red-500 dark:text-red-400 mt-1">{errors.longitude.message}</p>}
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
       </div>


       {/* ── RIGHT COLUMN ── */}
       <div className="space-y-6">
         {/* Linked Activities */}
         <div className="bg-card rounded-2xl border border-border shadow-sm p-6 space-y-4">
           <div>
             <h3 className="font-bold text-foreground text-sm">Things to Do</h3>
             <p className="text-[11px] text-muted-foreground mt-0.5">Activities shown on this destination&apos;s page. Manage activities in the Activities module.</p>
           </div>
           <LinkChecklist title="Activities" options={activityOptions} value={activityIds} onChange={setActivityIds} />
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
