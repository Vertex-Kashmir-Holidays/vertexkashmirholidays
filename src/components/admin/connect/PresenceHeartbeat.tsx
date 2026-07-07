"use client";
import { useCallback } from "react";
import { useVisibilityAwarePolling } from "./hooks/useVisibilityAwarePolling";

/**
 * Renders nothing. Fires a presence heartbeat immediately and every 30 s
 * while any admin page is mounted AND the tab is visible. Mounted once
 * inside AdminShell. Pauses entirely while the tab is hidden — a hidden tab
 * has nothing new to report, and the server's own effective-status logic
 * (lastSeenAt age) already degrades ONLINE → AWAY → OFFLINE over time, so a
 * paused heartbeat correctly lets presence go stale while unfocused. Resumes
 * and fires immediately the moment the tab regains focus.
 */
export function PresenceHeartbeat() {
  const send = useCallback(
    () => fetch("/api/connect/presence", { method: "POST" }).catch(() => {}),
    [],
  );
  useVisibilityAwarePolling(send, 30_000);
  return null;
}
