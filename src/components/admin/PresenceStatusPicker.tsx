"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PresenceStatus } from "@/components/admin/connect/hooks/usePresence";

interface Props {
  userImage: string | null;
  userName: string;
}

const STATUS_COLORS: Record<PresenceStatus, string> = {
  ONLINE: "bg-green-500",
  AWAY:   "bg-amber-400",
  BUSY:   "bg-red-500",
  OFFLINE: "bg-zinc-400",
};

const STATUS_LABELS: Record<PresenceStatus, string> = {
  ONLINE:  "Online",
  AWAY:    "Away",
  BUSY:    "Busy",
  OFFLINE: "Offline",
};

function Dot({ status, className }: { status: PresenceStatus; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-full border-2 border-card shrink-0",
        STATUS_COLORS[status],
        className,
      )}
    />
  );
}

export function PresenceStatusPicker({ userImage, userName }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<PresenceStatus>("ONLINE");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load current status once on mount
  useEffect(() => {
    fetch("/api/connect/presence")
      .then((r) => r.json())
      .then((d) => { if (d.status) setStatus(d.status as PresenceStatus); })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function setManualStatus(s: "ONLINE" | "AWAY" | "BUSY") {
    setSaving(true);
    try {
      await fetch("/api/connect/presence", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      });
      setStatus(s);
    } catch {
      // best-effort
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative transition hover:opacity-90"
        title="Set status"
        aria-label="Presence status"
      >
        {userImage ? (
          <Image
            src={userImage}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="rounded-full object-cover w-8 h-8"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Presence dot overlaid on the avatar */}
        <Dot
          status={status}
          className="absolute bottom-0 right-0 w-2.5 h-2.5"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
          <Link
            href="/admin/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            View profile
          </Link>
          <div className="h-px bg-border mx-3 my-1" />
          <p className="px-3.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Status
          </p>
          {(["ONLINE", "AWAY", "BUSY"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setManualStatus(s)}
              disabled={saving}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors hover:bg-muted",
                status === s ? "text-foreground font-semibold" : "text-muted-foreground",
              )}
            >
              <Dot status={s} className="w-2 h-2 border-0" />
              {STATUS_LABELS[s]}
              {status === s && <span className="ml-auto text-[10px] text-muted-foreground">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
