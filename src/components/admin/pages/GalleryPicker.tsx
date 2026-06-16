"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, X, Search, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryAsset {
  id: string;
  url: string;
  type: string; // "IMAGE" | "VIDEO"
  alt: string | null;
  category: string | null;
}

interface Props {
  open: boolean;
  /** Restrict the picker to a single media type. Omit to show everything. */
  type?: "IMAGE" | "VIDEO";
  title?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function GalleryPicker({ open, type, title, onSelect, onClose }: Props) {
  const [items, setItems] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [q, setQ] = useState("");

  // Load (or append) a page of gallery assets whenever the modal opens or the
  // page advances. Closing resets back to the first page.
  useEffect(() => {
    if (!open) {
      setItems([]);
      setPage(1);
      setQ("");
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (type) params.set("type", type);
    fetch(`/api/galleries?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { items: GalleryAsset[]; pages: number }) => {
        setItems((prev) => (page === 1 ? d.items : [...prev, ...d.items]));
        setPages(d.pages ?? 1);
      })
      .catch(() => toast.error("Couldn't load the gallery."))
      .finally(() => setLoading(false));
  }, [open, page, type]);

  if (!open) return null;

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? items.filter(
        (i) =>
          (i.alt ?? "").toLowerCase().includes(needle) ||
          (i.category ?? "").toLowerCase().includes(needle)
      )
    : items;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-display text-base font-bold text-foreground">
            {title ?? `Choose ${type === "VIDEO" ? "a video" : type === "IMAGE" ? "an image" : "media"} from gallery`}
          </h4>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by alt text or category..."
            className="w-full rounded-xl border border-border py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {filtered.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <p className="text-sm">No {type === "VIDEO" ? "videos" : type === "IMAGE" ? "images" : "media"} found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted transition hover:ring-2 hover:ring-primary"
                  title={item.alt ?? item.url}
                >
                  {item.type === "VIDEO" ? (
                    <video src={item.url} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt={item.alt ?? ""} className="h-full w-full object-cover" />
                  )}
                  {item.type === "VIDEO" && (
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-bold text-white">VIDEO</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {!loading && page < pages && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className={cn("rounded-xl border border-border px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted")}
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
