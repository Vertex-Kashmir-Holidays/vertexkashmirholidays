"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Images } from "lucide-react";
import { GalleryPicker } from "@/components/admin/pages/GalleryPicker";

const inputCls =
  "w-full rounded-xl border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25";

export function VideoField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
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

  // Only a self-hosted file (/uploads/... or a direct video URL) can preview in
  // a <video> tag; embed links (YouTube, etc.) are still valid but won't render.
  const canPreview = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(value) || value.startsWith("/uploads/");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Video URL or embed link" className={inputCls} />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          <Images className="h-4 w-4" />
          Gallery
        </button>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      </div>
      {value && canPreview && (
        <video src={value} controls playsInline className="h-20 w-auto rounded-lg border border-border object-cover" />
      )}
      <GalleryPicker open={pickerOpen} type="VIDEO" onSelect={onChange} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
