"use client";
import { useCallback } from "react";

// Module-level singleton shared across every hook instance.
// ConnectClient, ChatView, ChatInbox, and NotificationBell all call this hook.
// unlock() called in any one of them resumes the shared AudioContext for all.
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function beep(ctx: AudioContext, freq: number, startAt: number, dur: number, vol: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(vol, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
}

export function useNotificationSound() {
  // Call during a user gesture (click) to pre-authorise the AudioContext.
  // Browser autoplay policy blocks audio from timer/polling callbacks — the
  // context must be resumed inside a real interaction event first.
  const unlock = useCallback(() => {
    try {
      const ctx = getCtx();
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch {
      // not supported
    }
  }, []);

  /** Two ascending pings — @mentions or DMs directed at you. */
  const playMention = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      beep(ctx, 1046.5, t, 0.22, 0.55);        // C6
      beep(ctx, 1318.5, t + 0.24, 0.26, 0.45); // E6
    } catch {
      // best-effort
    }
  }, []);

  /** Single clean ping — messages in rooms you're not currently viewing. */
  const playMessage = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx || ctx.state !== "running") return;
      beep(ctx, 783.99, ctx.currentTime, 0.22, 0.4); // G5
    } catch {
      // best-effort
    }
  }, []);

  /** Descending two-tone chime — system notifications (lead assigned, new booking, etc.). */
  const playAlert = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      beep(ctx, 659.25, t, 0.28, 0.45);        // E5
      beep(ctx, 523.25, t + 0.24, 0.32, 0.38); // C5
    } catch {
      // best-effort
    }
  }, []);

  return { unlock, playMention, playMessage, playAlert };
}
