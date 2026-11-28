"use client";

// Turn push notifications on/off for THIS device — shared by the staff bell
// dropdown and the B2B agent account. Hidden until the VAPID key is set.
import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  // Same worker the app already registers for install (public/sw.js).
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export function PushNotificationsToggle({ className }: { className?: string }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        // iPhone/iPad: push only works from the Home Screen app.
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        return setState(ios ? "ios-install" : "unsupported");
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        }));
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error();
      setState("on");
      toast.success("Notifications are on for this device.");
    } catch {
      toast.error("Couldn't turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
      toast.success("Notifications are off for this device.");
    } catch {
      toast.error("Couldn't turn off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!PUBLIC_KEY || state === "loading" || state === "unsupported") return null;

  if (state === "ios-install" || state === "denied") {
    return (
      <p className={cn("text-[12px] text-muted-foreground", className)}>
        {state === "ios-install"
          ? "To get notifications on iPhone, tap Share → Add to Home Screen, then open the app from there."
          : "Notifications are blocked for this site. Allow them in your browser settings to turn them on."}
      </p>
    );
  }

  const on = state === "on";
  return (
    <button
      type="button"
      onClick={on ? disable : enable}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition disabled:opacity-60",
        on
          ? "border-border text-muted-foreground hover:bg-muted"
          : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : on ? (
        <BellOff className="h-3.5 w-3.5" />
      ) : (
        <Bell className="h-3.5 w-3.5" />
      )}
      {on ? "Turn off notifications on this device" : "Get notifications on this device"}
    </button>
  );
}
