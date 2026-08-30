"use client";

// Compose/send step for the "Request Rates" action — a real outbound email to
// a supplier, so it gets an explicit review step rather than firing on one
// click. Reuses the shared Dialog organism (Radix), same as every other
// admin confirm/compose flow in this app.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/organisms/dialog";

interface RequestRatesDialogProps {
  hotelId: string;
  hotelName: string;
  defaultEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition bg-card";

export function RequestRatesDialog({
  hotelId,
  hotelName,
  defaultEmail,
  open,
  onOpenChange,
}: RequestRatesDialogProps) {
  const router = useRouter();
  const [to, setTo] = useState(defaultEmail);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setTo(defaultEmail);
  }, [open, defaultEmail]);

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch(`/api/hotel-suppliers/${hotelId}/request-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("You don't have permission to send rate requests.");
          return;
        }
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        toast.error(typeof err?.error === "string" ? err.error : "Failed to send.");
        return;
      }
      toast.success(`Rate request sent to ${to}.`);
      router.refresh();
      onOpenChange(false);
    } catch {
      toast.error("An error occurred.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Rates — {hotelName}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Sends the standard B2B rate-request email on Vertex letterhead, from sales@vertexkashmirholidays.com.
          admin@vertexkashmirholidays.com is BCC&apos;d automatically.
        </DialogDescription>
        <div className="space-y-2 py-1">
          <label className="block text-xs font-bold text-muted-foreground">To</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="hotel@example.com"
            className={inputCls}
          />
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="text-sm font-bold text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl border border-border transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !to}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Request
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
