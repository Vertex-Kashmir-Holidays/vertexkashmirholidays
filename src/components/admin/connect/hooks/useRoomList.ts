"use client";
import { useState, useEffect, useCallback } from "react";

export interface RoomMember {
  userId: string;
  role: string;
  lastReadAt: string | null;
  user: { id: string; name: string | null; image: string | null };
}

export interface LastMessage {
  id: string;
  body: string | null;
  attachmentName: string | null;
  createdAt: string;
  senderId: string;
}

export interface ConnectRoom {
  id: string;
  type: "DIRECT" | "GROUP";
  name: string | null;
  avatarUrl: string | null;
  archivedAt: string | null;
  myRole: string;
  members: RoomMember[];
  messages: LastMessage[];
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useRoomList(enabled = true) {
  const [rooms, setRooms] = useState<ConnectRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [activeRes, archivedRes] = await Promise.all([
        fetch("/api/connect/rooms"),
        fetch("/api/connect/rooms?archived=true"),
      ]);
      const active: ConnectRoom[] = activeRes.ok ? await activeRes.json() : [];
      const archived: ConnectRoom[] = archivedRes.ok ? await archivedRes.json() : [];
      setRooms([...active, ...archived]);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [enabled, load]);

  return { rooms, loading, refetch: load };
}
