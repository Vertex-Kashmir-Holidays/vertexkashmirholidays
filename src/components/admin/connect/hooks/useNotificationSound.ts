"use client";
import { useCallback } from "react";

// ─── Module-level singleton ───────────────────────────────────────────────────
// One AudioContext for the entire browser session, shared across all hook
// instances. This is intentional: ConnectClient and ChatView both call this
// hook, and unlock() called in one must affect the context used by the other.
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

function beep(
  ctx: AudioContext,
  freq: number,
  startAt: number,
  dur: number,
  vol: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startAt);
  // Instant attack, natural exponential decay — bell-like
  gain.gain.setValueAtTime(vol, startAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotificationSound() {
  /**
   * Call this inside a real user-gesture handler (click, keydown) to pre-
   * authorize the AudioContext for subsequent timer-triggered playback.
   * Browser autoplay policy blocks audio from polling callbacks, so we must
   * unlock during an interaction first.
   */
  const unlock = useCallback(() => {
    try {
      const ctx = getCtx();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    } catch {
      // not supported
    }
  }, []);

  /** Two ascending pings — for @mentions or direct messages to you. */
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

  /** Single clean ping — for messages in rooms you're not currently viewing. */
  const playMessage = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx || ctx.state !== "running") return;
      beep(ctx, 783.99, ctx.currentTime, 0.22, 0.4); // G5
    } catch {
      // best-effort
    }
  }, []);

  /** Descending two-tone chime — for system notifications (lead assigned, etc.). */
  const playAlert = useCallback(() => {
    try {
      const ctx = getCtx();
      if (!ctx || ctx.state !== "running") return;
      const t = ctx.currentTime;
      beep(ctx, 659.25, t, 0.28, 0.45);        // E5 — higher note first
      beep(ctx, 523.25, t + 0.24, 0.32, 0.38); // C5 — descending, softer
    } catch {
      // best-effort
    }
  }, []);

  return { playMention, playMessage, playAlert, unlock };
}
