"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, X, Search, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageDimensionBadge } from "@/components/ui/ImageDimensionBadge";

type SourceFilter = "ALL" | "LOCAL" | "STOCK";

interface GalleryAsset {
  id: string;
  url: string;
  publicId: string | null;
  type: string; // "IMAGE" | "VIDEO"
  alt: string | null;
  category: string | null;
}

function assetSource(item: GalleryAsset): "LOCAL" | "STOCK" {
  return item.url.startsWith("/") ? "LOCAL" : "STOCK";
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
  const [source, setSource] = useState<SourceFilter>("ALL");
  const [dims, setDims] = useState<Record<string, { width: number; height: number }>>({});

  // Load (or append) a page of gallery assets whenever the modal opens or the
  // page advances. Closing resets back to the first page.
  useEffect(() => {
    if (!open) {
      setItems([]);
      setPage(1);
      setQ("");
      setSource("ALL");
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
  const filtered = items.filter((i) => {
    if (source !== "ALL" && assetSource(i) !== source) return false;
    if (!needle) return true;
    return (
      (i.alt ?? "").toLowerCase().includes(needle) ||
      (i.category ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-card p-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h4 className="font-display text-base font-bold text-foreground">
            {title ?? `Choose ${type === "VIDEO" ? "a video" : type === "IMAGE" ? "an image" : "media"} from gallery`}
          </h4>
          <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Source tabs — wrap (never scroll) so pills/emoji are never clipped. */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {([
            { key: "ALL",   label: "All" },
            { key: "LOCAL", label: "💾 Local" },
            { key: "STOCK", label: "🌐 Stock / Cloudinary" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSource(key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold leading-normal transition-colors",
                source === key ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {label}
            </button>
          ))}
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
                    <img
                      src={item.url}
                      alt={item.alt ?? ""}
                      className="h-full w-full object-cover"
                      onLoad={(e) => {
                        const { naturalWidth, naturalHeight } = e.currentTarget;
                        setDims((prev) => ({ ...prev, [item.id]: { width: naturalWidth, height: naturalHeight } }));
                      }}
                    />
                  )}
                  {item.type === "VIDEO" && (
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-bold text-white">VIDEO</span>
                  )}
                  {item.type !== "VIDEO" && dims[item.id] && (
                    <ImageDimensionBadge
                      width={dims[item.id].width}
                      height={dims[item.id].height}
                      className="absolute top-1 right-1"
                    />
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
