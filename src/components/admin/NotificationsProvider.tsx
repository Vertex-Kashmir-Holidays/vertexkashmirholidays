"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useVisibilityAwarePolling } from "@/components/admin/connect/hooks/useVisibilityAwarePolling";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsValue {
  items: NotificationItem[];
  /** Awaits the POST, then marks read — used where the caller shows its own loading state. */
  markReadAwait: (ids: string[]) => Promise<void>;
  /** Marks read immediately (optimistic), fires the POST in the background. */
  markReadOptimistic: (ids: string[]) => void;
}

const Ctx = createContext<NotificationsValue | null>(null);

/**
 * Single shared poll of GET /api/notifications, reused by ChatInbox and
 * NotificationBell — previously each component polled this endpoint
 * independently every 30s, doubling the request count for identical data.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const j = (await res.json()) as { items: NotificationItem[]; unreadCount: number };
      setItems(j.items);
    } catch {
      /* best-effort */
    }
  }, []);

  useVisibilityAwarePolling(load, 60_000);

  const markReadAwait = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setItems((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }, []);

  const markReadOptimistic = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).catch(() => {});
    setItems((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }, []);

  return (
    <Ctx.Provider value={{ items, markReadAwait, markReadOptimistic }}>{children}</Ctx.Provider>
  );
}

export function useNotificationsFeed(): NotificationsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotificationsFeed must be used within NotificationsProvider");
  return ctx;
}
