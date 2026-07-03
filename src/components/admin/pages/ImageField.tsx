"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Loader2, Images } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";
import { ImageDimensionBadge } from "@/components/ui/ImageDimensionBadge";

const inputCls =
  "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function ImageField({
  value,
  onChange,
  folder = "general",
}: {
  value: string;
  onChange: (v: string) => void;
  /** Module folder uploads are filed under (also their gallery category). */
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => setDims(null), [value]);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Controls wrap on narrow screens so nothing overflows at ≤360px. */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL" className={`${inputCls} min-w-0 flex-1 basis-[180px]`} />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          <Images className="h-4 w-4" />
          Gallery
        </button>
        <label className="flex min-h-[40px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          {/* Helper text hidden on the smallest screens to save width. */}
          <span className="hidden text-[10px] text-muted-foreground sm:inline">PNG · SVG · WebP · max 500 KB</span>
        </label>
      </div>
      {value && (
        <div className="relative inline-block">
          <Image
            key={value}
            src={value}
            alt=""
            width={160}
            height={96}
            className="h-16 w-auto max-w-full rounded-lg border border-border object-cover"
            unoptimized
            onLoad={(e) => {
              const { naturalWidth, naturalHeight } = e.currentTarget;
              setDims({ width: naturalWidth, height: naturalHeight });
            }}
          />
          {dims && (
            <ImageDimensionBadge width={dims.width} height={dims.height} className="absolute top-1 right-1" />
          )}
        </div>
      )}
      <GalleryPicker open={pickerOpen} type="IMAGE" onSelect={onChange} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
