"use client";

// Guards a duplicated proposal/itinerary that hasn't been updated yet (still
// titled "… - copy" — see documentTitle.ts). Saving is refused until the
// customer name/phone/duration changes, and leaving without doing so deletes
// the copy, so the lists never collect duplicate junk:
//  - in-app links (back arrow, sidebar…) → confirm dialog: keep editing, or
//    delete the copy and go;
//  - closing/reloading the tab → the browser's leave prompt, then delete;
//  - any other exit (browser Back) → deleted silently on unmount.
// Copies abandoned even so are purged by the list after STALE_COPY_MS.
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/connect/ConfirmDialog";

// Pending unmount-deletes by URL — lets React Strict Mode's dev-only
// unmount/remount cancel the delete instead of destroying the copy.
const pendingDeletes = new Map<string, ReturnType<typeof setTimeout>>();

function discard(deleteUrl: string) {
  return fetch(deleteUrl, { method: "DELETE", keepalive: true }).catch(() => undefined);
}

interface Props {
  /** True while the record is still an untouched copy. */
  active: boolean;
  /** DELETE endpoint for this record. */
  deleteUrl: string;
  /** "proposal" / "itinerary" — used in the copy. */
  noun: string;
}

export function UntouchedCopyGuard({ active, deleteUrl, noun }: Props) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const pending = pendingDeletes.get(deleteUrl);
    if (pending) {
      clearTimeout(pending);
      pendingDeletes.delete(deleteUrl);
    }
    return () => {
      if (!activeRef.current) return;
      pendingDeletes.set(
        deleteUrl,
        setTimeout(() => {
          pendingDeletes.delete(deleteUrl);
          void discard(deleteUrl);
        }, 300),
      );
    };
  }, [deleteUrl]);

  useEffect(() => {
    if (!active) return;

    // Capture phase on document runs before Next's <Link> handler.
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(url.pathname + url.search + url.hash);
    }
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    function onPageHide() {
      activeRef.current = false; // unmount must not delete twice
      void discard(deleteUrl);
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [active, deleteUrl]);

  if (!active) return null;

  async function deleteAndLeave(href: string) {
    activeRef.current = false;
    setPendingHref(null);
    await discard(deleteUrl);
    router.push(href);
    router.refresh();
  }

  return (
    <>
      <div className="px-3 pt-3 no-print sm:px-5">
        <div className="mx-auto flex max-w-[900px] items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200">
          <Copy className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This is a copy. Update the customer name or phone and save to keep it — an unchanged
            copy is deleted when you leave.
          </p>
        </div>
      </div>
      <ConfirmDialog
        open={pendingHref !== null}
        title={`This ${noun} copy hasn't been updated`}
        description={`Update the customer name or phone and save it, otherwise this copy will be deleted when you leave.`}
        cancelLabel="Keep editing"
        confirmLabel="Delete copy & leave"
        destructive
        onCancel={() => setPendingHref(null)}
        onConfirm={() => pendingHref && void deleteAndLeave(pendingHref)}
      />
    </>
  );
}
