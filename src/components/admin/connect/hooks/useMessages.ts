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
}

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ConnectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const latestRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setLoading(false);
      setHasMore(false);
      latestRef.current = null;
      return;
    }
    setLoading(true);
    setMessages([]);
    latestRef.current = null;

    fetch(`/api/connect/rooms/${roomId}/messages`)
      .then((r) => r.json())
      .then(({ messages: msgs, hasMore: hm }: FetchResult) => {
        setMessages(msgs);
        setHasMore(hm);
        if (msgs.length > 0) latestRef.current = msgs[msgs.length - 1].createdAt;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [roomId]);

  // Poll for new messages every 3 s
  const poll = useCallback(async () => {
    if (!roomId || !latestRef.current) return;
    try {
      const res = await fetch(
        `/api/connect/rooms/${roomId}/messages?after=${encodeURIComponent(latestRef.current)}`,
      );
      if (!res.ok) return;
      const { messages: newMsgs } = (await res.json()) as FetchResult;
      if (newMsgs.length === 0) return;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...newMsgs.filter((m) => !ids.has(m.id))];
      });
      latestRef.current = newMsgs[newMsgs.length - 1].createdAt;
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
      latestRef.current = msg.createdAt;
      return [...prev, msg];
    });
  }, []);

  return { messages, loading, hasMore, loadMore, appendOptimistic };
}
