"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export interface MessageSender {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ConnectMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender: MessageSender;
  body: string | null;
  attachmentUrl: string | null;
  attachmentPublicId: string | null;
  attachmentType: string | null;
  attachmentName: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

interface FetchResult {
  messages: ConnectMessage[];
  hasMore: boolean;
  typing: Array<{ id: string; name: string | null }>;
}

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ConnectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [typing, setTyping] = useState<Array<{ id: string; name: string | null }>>([]);
  const lastPollTimeRef = useRef<Date>(new Date());

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      setHasMore(false);
      setTyping([]);
      return;
    }
    setLoading(true);
    setMessages([]);

    fetch(`/api/connect/rooms/${roomId}/messages`)
      .then((r) => r.json())
      .then(({ messages: msgs, hasMore: hm, typing: t }: FetchResult) => {
        setMessages(msgs);
        setHasMore(hm);
        setTyping(t ?? []);
        lastPollTimeRef.current = new Date();
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  // Poll for new/edited/deleted messages and typing state every 3 s
  const poll = useCallback(async () => {
    if (!roomId) return;
    const since = lastPollTimeRef.current;
    lastPollTimeRef.current = new Date(); // advance cursor before fetch to avoid missing rapid updates
    try {
      const res = await fetch(
        `/api/connect/rooms/${roomId}/messages?since=${encodeURIComponent(since.toISOString())}`,
      );
      if (!res.ok) return;
      const { messages: updates, typing: t } = (await res.json()) as FetchResult;
      setTyping(t ?? []);
      if (updates.length === 0) return;
      // Keep lastReadAt fresh while the room is open so the unread count stays zero
      fetch(`/api/connect/rooms/${roomId}/read`, { method: "POST" }).catch(() => {});
      // Signal ChatInbox to immediately clear stale notifications for this room
      window.dispatchEvent(new CustomEvent("connect:mark-room-read", { detail: { roomId } }));
      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        for (const msg of updates) {
          map.set(msg.id, msg); // replaces edited/deleted, appends new
        }
        return [...map.values()].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
    } catch {
      // best-effort
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const id = setInterval(poll, 3_000);
    return () => clearInterval(id);
  }, [roomId, poll]);

  const loadMore = useCallback(async () => {
    if (!roomId || !hasMore || messages.length === 0) return;
    const oldest = messages[0].createdAt;
    const res = await fetch(
      `/api/connect/rooms/${roomId}/messages?before=${encodeURIComponent(oldest)}`,
    );
    if (!res.ok) return;
    const { messages: older, hasMore: hm } = (await res.json()) as FetchResult;
    setMessages((prev) => [...older, ...prev]);
    setHasMore(hm);
  }, [roomId, hasMore, messages]);

  const appendOptimistic = useCallback((msg: ConnectMessage) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const updateMessage = useCallback((updated: ConnectMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  return { messages, loading, hasMore, loadMore, appendOptimistic, updateMessage, removeMessage, typing };
}
