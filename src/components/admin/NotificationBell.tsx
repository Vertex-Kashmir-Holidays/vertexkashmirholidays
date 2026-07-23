"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/organisms/dropdown-menu";
import { useNotificationsFeed } from "@/components/admin/NotificationsProvider";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const { items: allItems, markReadAwait } = useNotificationsFeed();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // All Connect-related notifications (CHAT_*) live in ChatInbox — exclude them here.
  const items = allItems.filter((n) => !n.type.startsWith("CHAT_"));
  const unread = items.filter((n) => !n.readAt).length;

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    // Opening with unread items → mark only system notifications read (not chat).
    if (next && unread > 0) {
      setLoading(true);
      try {
        const unreadIds = items.filter((n) => !n.readAt).map((n) => n.id);
        await markReadAwait(unreadIds);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[12px] font-bold text-white bg-red-500 rounded-full">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-bold text-foreground">Notifications</p>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-border">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            items.map((n) => {
              const body = (
                <div
                  className={cn(
                    "flex gap-2.5 px-4 py-3 hover:bg-muted/50 transition-colors",
                    !n.readAt && "bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                      n.readAt ? "bg-transparent" : "bg-primary",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground">{n.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 break-words">
                      {n.body}
                    </p>
                    <p className="text-[12px] text-muted-foreground/70 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)} className="block">
                  {body}
                </Link>
              ) : (
                <div key={n.id}>{body}</div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
