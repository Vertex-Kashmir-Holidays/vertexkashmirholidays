"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/organisms/dialog";

/**
 * Delete-hotel confirmation. Linked booking stays are never touched — they keep
 * the hotel name they were booked under (the link is cleared, ON DELETE SET
 * NULL) — but they stop counting towards this hotel, so the dialog says so.
 */
export function DeleteHotelDialog({
  hotelId,
  hotelName,
  linkedStays,
}: {
  hotelId: string;
  hotelName: string;
  /** Booking stays linked to this hotel (any confirmation status), if known. */
  linkedStays: number | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/hotel-suppliers/${hotelId}`, { method: "DELETE" });
      if (res.status === 403) {
        toast.error("You don't have permission to delete hotel rates.");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("Hotel deleted.");
      router.push("/admin/hotel-suppliers");
      router.refresh();
    } catch {
      toast.error("Failed to delete hotel.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/10 dark:text-red-400"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
      <Dialog open={open} onOpenChange={(o) => !deleting && setOpen(o)}>
        <DialogContent className="max-w-md">
          {/* This project's DialogHeader is a row — stack title over text here. */}
          <DialogHeader className="flex-col items-start gap-2 pr-6">
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" /> Delete {hotelName}?
            </DialogTitle>
            <DialogDescription>
              This permanently removes the hotel, its contact details and room rates from the
              hotel list. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          {linkedStays != null && linkedStays > 0 && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              {linkedStays} booking stay{linkedStays === 1 ? " is" : "s are"} linked to this hotel.
              Those bookings are not changed — they keep the hotel name — but they will no longer be
              linked or counted here.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Delete hotel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
