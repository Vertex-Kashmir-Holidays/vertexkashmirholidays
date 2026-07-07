"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export type PresenceStatus = "ONLINE" | "AWAY" | "BUSY" | "OFFLINE";
export type PresenceMap = Record<string, PresenceStatus>;

/**
 * Polls presence for the given user IDs every 60 s. Only used within Vertex
 * Connect (room list / participant views) — never runs outside it.
 * Returns a map of userId → effective status; absent keys should be treated as OFFLINE.
 */
export function usePresence(userIds: string[]): PresenceMap {
  const [map, setMap] = useState<PresenceMap>({});
  // Keep a ref so the poll callback never needs to be recreated as ids change
  const idsRef = useRef<string>("");
  idsRef.current = [...userIds].sort().join(",");

  const poll = useCallback(async () => {
    const ids = idsRef.current;
    if (!ids) return;
    try {
      const res = await fetch(`/api/connect/presence?ids=${ids}`);
      if (res.ok) setMap(await res.json());
    } catch {
      // best-effort
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, [poll]);

  return map;
}
