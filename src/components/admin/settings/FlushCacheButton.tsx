"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

// Manual "Flush cache" control. Public pages are served from ISR (5 min), so
// this lets staff force every public page to re-render immediately after an
// important content or image change.
export function FlushCacheButton() {
  const [isPending, startTransition] = useTransition();

  const flush = () => {
    startTransition(async () => {
      const res = await fetch("/api/admin/cache/flush", { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to flush cache.");
        return;
      }
      toast.success("Cache flushed — public pages will refresh on next visit.");
    });
  };

  return (
    <button
      type="button"
      onClick={flush}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Flush cache
    </button>
  );
}
