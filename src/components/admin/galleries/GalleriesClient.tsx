"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryItem {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  category: string | null;
  sortOrder: number;
  createdAt: Date | string;
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

  const filtered = categoryFilter === "ALL"
    ? initialItems
    : initialItems.filter((i) => i.category === categoryFilter);

  async function handleUpload(files: FileList) {
    setUploading(true);
    let uploaded = 0;
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        if (!res.ok) continue;
        const { url } = await res.json() as { url: string };
        await fetch("/api/galleries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, category: newCategory || undefined, alt: newAlt || undefined }),
        });
        uploaded++;
      }
      toast.success(`${uploaded} image${uploaded !== 1 ? "s" : ""} uploaded.`);
      router.refresh();
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
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
          <h2 className="font-display font-extrabold text-brand-navy text-xl">Gallery</h2>
          <p className="text-gray-400 text-xs mt-0.5">{totalCount} images across {categories.length} categories</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        {/* Grid */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Category filter strip */}
          <div className="flex items-center gap-2 p-4 border-b border-gray-100 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors", categoryFilter === "ALL" ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
            >
              All ({totalCount})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn("text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap transition-colors", categoryFilter === cat ? "bg-brand-navy text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Image grid */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">No images yet. Upload some!</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
              {filtered.map((item) => (
                <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.alt ?? ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setEditItem({ ...item })}
                      className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center text-brand-navy hover:bg-white transition-colors"
                      title="Edit"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                    {confirmDelete === item.id ? (
                      <>
                        <button onClick={() => handleDelete(item.id)} disabled={isPending} className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center text-gray-600 hover:bg-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(item.id)}
                        className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center text-red-500 hover:bg-white transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-brand-navy text-sm">Upload Images</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Default Category</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. Landscapes, Food..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alt Text</label>
              <input
                type="text"
                value={newAlt}
                onChange={(e) => setNewAlt(e.target.value)}
                placeholder="Image description..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition"
              />
            </div>

            <label className={cn("flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer transition-colors hover:border-brand-green hover:bg-brand-green/5", uploading && "opacity-50 pointer-events-none")}>
              {uploading ? <Loader2 className="w-6 h-6 text-brand-green animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
              <p className="text-xs font-semibold text-gray-500">{uploading ? "Uploading..." : "Click to select images"}</p>
              <p className="text-[10px] text-gray-400">PNG, JPG, WebP • Max 5MB each</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>
          </div>

          {/* Edit item */}
          {editItem && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-brand-navy text-sm">Edit Image</h3>
                <button onClick={() => setEditItem(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editItem.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Alt Text</label>
                <input
                  value={editItem.alt ?? ""}
                  onChange={(e) => setEditItem({ ...editItem, alt: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                <input
                  value={editItem.category ?? ""}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/25 focus:border-brand-green transition"
                />
              </div>
              <button
                onClick={() => handleSaveEdit(editItem)}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
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
