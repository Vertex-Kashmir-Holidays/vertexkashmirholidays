"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { STOCK_IMAGES } from "@/types/itinerary";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  value: string;
  onChange: (src: string) => void;
  /** Extra classes for the trigger button (positioned by the parent). */
  className?: string;
  label?: string;
}

interface GalleryAsset {
  id: string;
  url: string;
  alt: string | null;
  category: string | null;
}

type Tab = "stock" | "gallery";

export function ImagePicker({ value, onChange, className, label = "Change image" }: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("stock");
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Gallery tab state — loaded lazily the first time the tab is opened.
  const [galleryItems, setGalleryItems] = useState<GalleryAsset[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryPage, setGalleryPage] = useState(1);
  const [galleryPages, setGalleryPages] = useState(1);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || tab !== "gallery") return;
    setGalleryLoading(true);
    const params = new URLSearchParams({ page: String(galleryPage), type: "IMAGE" });
    fetch(`/api/galleries?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { items: GalleryAsset[]; pages: number }) => {
        setGalleryItems((prev) => (galleryPage === 1 ? d.items : [...prev, ...d.items]));
        setGalleryPages(d.pages ?? 1);
      })
      .catch(() => toast.error("Couldn't load the gallery."))
      .finally(() => setGalleryLoading(false));
  }, [open, tab, galleryPage]);

  function close() {
    setOpen(false);
    setTab("stock");
    setGalleryPage(1);
  }

  function select(src: string) {
    onChange(src);
    close();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "itinerary");
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
      toast.success("Image uploaded.");
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const tabBtn = (t: Tab, text: string) => (
    <button
      type="button"
      onClick={() => setTab(t)}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-bold transition",
        tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {text}
    </button>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-black/70 no-print",
          className,
        )}
      >
        <ImageIcon className="h-3.5 w-3.5" /> {label}
      </button>

      {open && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={close} />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Choose an image</h3>
                <button onClick={close} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {tabBtn("stock", "Stock images")}
                {tabBtn("gallery", "Gallery")}
              </div>

              {tab === "stock" ? (
                <div className="mt-4 grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
                  {STOCK_IMAGES.map((img) => (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => select(img.src)}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border-2 transition",
                        value === img.src ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/50",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.src} alt={img.label} className="h-20 w-full object-cover" loading="lazy" />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 max-h-[55vh] overflow-y-auto">
                  {galleryItems.length === 0 && !galleryLoading ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                      <ImageIcon className="h-8 w-8" />
                      <p className="text-xs">No gallery images yet. Add some in the Gallery module.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {galleryItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => select(item.url)}
                            className={cn(
                              "group relative overflow-hidden rounded-lg border-2 transition",
                              value === item.url ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-primary/50",
                            )}
                            title={item.alt ?? item.url}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.url} alt={item.alt ?? ""} className="h-20 w-full object-cover" loading="lazy" />
                            {item.category && (
                              <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white">
                                {item.category}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-3">
                        {galleryLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        {!galleryLoading && galleryPage < galleryPages && (
                          <button
                            type="button"
                            onClick={() => setGalleryPage((p) => p + 1)}
                            className="rounded-lg border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
                          >
                            Load more
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">Or upload your own (max 5 MB).</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {uploading ? "Uploading…" : "Upload image"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
