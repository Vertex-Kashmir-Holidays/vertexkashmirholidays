"use client";
import { useEffect } from "react";

/**
 * Renders nothing. Fires a presence heartbeat immediately and every 30 s
 * while any admin page is mounted. Mounted once inside AdminShell.
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    const send = () =>
      fetch("/api/connect/presence", { method: "POST" }).catch(() => {});
    send();
    const id = setInterval(send, 30_000);
    return () => clearInterval(id);
  }, []);
  return null;
}
