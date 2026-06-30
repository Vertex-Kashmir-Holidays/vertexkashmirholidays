"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, Tag, X, Copy, Check, Film, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type MediaType = "IMAGE" | "VIDEO";
type SourceTab = "ALL" | "LOCAL" | "STOCK";

interface GalleryItem {
  id: string;
  url: string;
  publicId: string | null;
  type: string; // "IMAGE" | "VIDEO" — stored as a plain string column
  alt: string | null;
  caption: string | null;
  category: string | null;
  sortOrder: number;
  createdAt: Date | string;
}

// Local = served from /uploads/* on this server. Stock = everything else
// (Cloudinary, external stock, etc.) — unified into one tab.
function getSource(item: GalleryItem): "LOCAL" | "STOCK" {
  return item.url.startsWith("/") ? "LOCAL" : "STOCK";
}

interface Props {
  initialItems: GalleryItem[];
  totalCount: number;
  categories: string[];
}

export function GalleriesClient({ initialItems, totalCount, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newAlt, setNewAlt] = useState("");
  const [editItem, setEditItem] = useState<GalleryItem | null>(null);
  const [typeFilter, setTypeFilter] = useState<"ALL" | MediaType>("ALL");
  const [sourceTab, setSourceTab] = useState<SourceTab>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [brokenIds, setBrokenIds] = useState<Set<string>>(new Set());

  const filtered = initialItems.filter(
    (i) =>
      (categoryFilter === "ALL" || i.category === categoryFilter) &&
      (typeFilter === "ALL" || i.type === typeFilter) &&
      (sourceTab === "ALL" || getSource(i) === sourceTab)
  );

  async function handleUpload(files: FileList) {
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        // The uploads route stores the file under the chosen category folder and
        // registers it in the Gallery in one step — no separate create needed.
        const fd = new FormData();
        fd.append("file", file);
        if (newCategory) fd.append("folder", newCategory);
        if (newAlt) fd.append("alt", newAlt);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: "" }));
          if (error) toast.error(error);
          continue;
        }
        uploaded++;
      }
      if (uploaded > 0) toast.success(`${uploaded} file${uploaded !== 1 ? "s" : ""} uploaded.`);
      router.refresh();
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCopyUrl(item: GalleryItem) {
    const absolute = item.url.startsWith("http")
      ? item.url
      : `${window.location.origin}${item.url}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absolute);
      } else {
        // Fallback for HTTP contexts or browsers that block clipboard API
        const ta = document.createElement("textarea");
        ta.value = absolute;
        ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedId(item.id);
      toast.success("URL copied to clipboard.");
      setTimeout(() => setCopiedId((c) => (c === item.id ? null : c)), 1500);
    } catch {
      toast.error("Couldn't copy URL — try selecting the URL manually.");
    }
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/galleries/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        toast.success("Image removed.");
        router.refresh();
      } catch {
        toast.error("Failed to delete.");
      } finally {
        setConfirmDelete(null);
      }
    });
  }

  async function handleSaveEdit(item: GalleryItem) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/galleries/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alt: item.alt, caption: item.caption, category: item.category }),
        });
        if (!res.ok) throw new Error();
        toast.success("Saved.");
        setEditItem(null);
        router.refresh();
      } catch {
        toast.error("Failed to save.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-foreground text-xl">Gallery</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{totalCount} items across {categories.length} categories</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        {/* Grid */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Source tab strip */}
          <div className="flex items-center gap-2 p-4 pb-0 overflow-x-auto border-b border-border">
            {([
              { key: "ALL",   label: "All sources" },
              { key: "LOCAL", label: "💾 Local" },
              { key: "STOCK", label: "🌐 Stock / Cloudinary" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSourceTab(key)}
                className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors", sourceTab === key ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Type filter strip */}
          <div className="flex items-center gap-2 p-4 pb-0 overflow-x-auto">
            {([
              { key: "ALL", label: "All media" },
              { key: "IMAGE", label: "Images" },
              { key: "VIDEO", label: "Videos" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors", typeFilter === key ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Category filter strip */}
          <div className="flex items-center gap-2 p-4 border-b border-border overflow-x-auto">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors", categoryFilter === "ALL" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted")}
            >
              All ({totalCount})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors", categoryFilter === cat ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted")}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Image grid */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground text-sm">No media yet. Upload some!</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
              {filtered.map((item) => (
                <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                  {item.type === "VIDEO" ? (
                    <video src={item.url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                  ) : brokenIds.has(item.id) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-red-50 dark:bg-red-950/30 text-red-400">
                      <ImageOff className="w-6 h-6" />
                      <span className="text-[9px] font-bold">Broken</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.alt ?? ""}
                      className="w-full h-full object-cover"
                      onError={() => setBrokenIds((prev) => new Set([...prev, item.id]))}
                    />
                  )}
                  <div className={cn(
                    "absolute inset-0 transition-all flex items-center justify-center gap-2",
                    brokenIds.has(item.id)
                      ? "bg-black/30 opacity-100" // always visible for broken images
                      : "bg-black/0 group-hover:bg-black/50 opacity-0 group-hover:opacity-100",
                  )}>
                    <button
                      onClick={() => handleCopyUrl(item)}
                      className="w-7 h-7 rounded-lg bg-card/90 flex items-center justify-center text-foreground hover:bg-card transition-colors"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditItem({ ...item })}
                      className="w-7 h-7 rounded-lg bg-card/90 flex items-center justify-center text-foreground hover:bg-card transition-colors"
                      title="Edit"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                    {confirmDelete === item.id ? (
                      <>
                        <button onClick={() => handleDelete(item.id)} disabled={isPending} className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="w-7 h-7 rounded-lg bg-card/90 flex items-center justify-center text-muted-foreground hover:bg-card">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        className="w-7 h-7 rounded-lg bg-card/90 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-card transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {item.type === "VIDEO" && (
                    <span className="absolute top-1.5 left-1.5 flex items-center gap-1 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-md pointer-events-none">
                      <Film className="w-2.5 h-2.5" /> VIDEO
                    </span>
                  )}
                  {item.category && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-md">
                      {item.category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Upload */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-foreground text-sm">Upload Media</h3>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Default Category</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Landscapes, Food..."
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Alt Text</label>
              <input
                type="text"
                value={newAlt}
                onChange={(e) => setNewAlt(e.target.value)}
                placeholder="Image description..."
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
              />
            </div>

            <label className={cn("flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer transition-colors hover:border-primary hover:bg-primary/5", uploading && "opacity-50 pointer-events-none")}>
              {uploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
              <p className="text-xs font-semibold text-muted-foreground">{uploading ? "Uploading..." : "Click to select files"}</p>
              <p className="text-[10px] text-muted-foreground">PNG · SVG · WebP (max 500 KB) • Video (max 10 MB)</p>
              <input
                type="file"
                accept="image/png,image/svg+xml,image/webp,video/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>
          </div>

          {/* Edit item */}
          {editItem && (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm">Edit Image</h3>
                <button onClick={() => setEditItem(null)} className="text-muted-foreground hover:text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                {editItem.type === "VIDEO" ? (
                  <video src={editItem.url} controls playsInline className="w-full h-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editItem.url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <button
                onClick={() => handleCopyUrl(editItem)}
                className="w-full flex items-center justify-center gap-2 border border-border hover:bg-muted text-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                {copiedId === editItem.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copy URL
              </button>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Alt Text</label>
                <input
                  value={editItem.alt ?? ""}
                  onChange={(e) => setEditItem({ ...editItem, alt: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Category</label>
                <input
                  value={editItem.category ?? ""}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition"
                />
              </div>
              <button
                onClick={() => handleSaveEdit(editItem)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
