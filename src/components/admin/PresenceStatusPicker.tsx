"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/organisms/dropdown-menu";
import type { PresenceStatus } from "@/components/admin/connect/hooks/usePresence";

interface Props {
  userImage: string | null;
  userName: string;
}

const STATUS_COLORS: Record<PresenceStatus, string> = {
  ONLINE: "bg-green-500",
  AWAY: "bg-amber-400",
  BUSY: "bg-red-500",
  OFFLINE: "bg-zinc-400",
};

const STATUS_LABELS: Record<PresenceStatus, string> = {
  ONLINE: "Online",
  AWAY: "Away",
  BUSY: "Busy",
  OFFLINE: "Offline",
};

function Dot({ status, className }: { status: PresenceStatus; className?: string }) {
  return (
    <span
      className={cn("rounded-full border-2 border-card shrink-0", STATUS_COLORS[status], className)}
    />
  );
}

export function PresenceStatusPicker({ userImage, userName }: Props) {
  const [status, setStatus] = useState<PresenceStatus>("ONLINE");
  const [saving, setSaving] = useState(false);

  // Load current status once on mount
  useEffect(() => {
    fetch("/api/connect/presence")
      .then((r) => r.json())
      .then((d) => {
        if (d.status) setStatus(d.status as PresenceStatus);
      })
      .catch(() => {});
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
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
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
          <Dot status={status} className="absolute bottom-0 right-0 w-2.5 h-2.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild className="text-xs text-muted-foreground">
          <Link href="/admin/profile">View profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {(["ONLINE", "AWAY", "BUSY"] as const).map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => setManualStatus(s)}
            disabled={saving}
            className={cn(
              "text-xs",
              status === s ? "text-foreground font-semibold" : "text-muted-foreground",
            )}
          >
            <Dot status={s} className="w-2 h-2 border-0" />
            {STATUS_LABELS[s]}
            {status === s && <span className="ml-auto text-[12px] text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
