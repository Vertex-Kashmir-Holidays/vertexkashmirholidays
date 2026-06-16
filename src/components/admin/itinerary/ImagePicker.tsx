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

export function ImagePicker({ value, onChange, className, label = "Change image" }: ImagePickerProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
      toast.success("Image uploaded.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Choose an image</h3>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
                {STOCK_IMAGES.map((img) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => { onChange(img.src); setOpen(false); }}
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
