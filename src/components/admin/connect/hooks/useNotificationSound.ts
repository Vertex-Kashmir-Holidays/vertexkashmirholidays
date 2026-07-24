"use client";
import { useCallback } from "react";

// Module-level singletons shared across every hook instance.
// unlock() called in any one of them resumes the shared AudioContext for all.
let audioCtx: AudioContext | null = null;
let ringIntervalId: ReturnType<typeof setInterval> | null = null;

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
      beep(ctx, 1046.5, t, 0.22, 0.55); // C6
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
      beep(ctx, 659.25, t, 0.28, 0.45); // E5
      beep(ctx, 523.25, t + 0.24, 0.32, 0.38); // C5
    } catch {
      // best-effort
    }
  }, []);

  const stopRing = useCallback(() => {
    if (ringIntervalId !== null) {
      clearInterval(ringIntervalId);
      ringIntervalId = null;
    }
  }, []);

  /** Mobile-style ring tone — loops every 2s until stopRing() is called. */
  const playRing = useCallback(() => {
    if (ringIntervalId !== null) clearInterval(ringIntervalId);

    // Chrome allows ctx.resume() without a fresh gesture if the user has
    // previously interacted with the page (stored user-activation state).
    // This covers the case where the poll fires before the first click on the
    // GlobalCallNotification card but after any earlier navigation click.
    const ctx0 = getCtx();
    if (ctx0 && ctx0.state === "suspended") ctx0.resume().catch(() => {});

    function oneCycle() {
      try {
        const ctx = getCtx();
        if (!ctx || ctx.state !== "running") return;
        const t = ctx.currentTime;
        beep(ctx, 392, t, 0.18, 0.5); // G4
        beep(ctx, 523, t, 0.18, 0.4); // C5
        beep(ctx, 440, t + 0.22, 0.18, 0.5); // A4
        beep(ctx, 587, t + 0.22, 0.18, 0.4); // D5
        beep(ctx, 494, t + 0.44, 0.18, 0.5); // B4
        beep(ctx, 659, t + 0.44, 0.18, 0.4); // E5
        beep(ctx, 523, t + 0.66, 0.22, 0.45); // C5
        beep(ctx, 784, t + 0.66, 0.22, 0.35); // G5
      } catch {
        // best-effort
      }
    }

    oneCycle();
    ringIntervalId = setInterval(oneCycle, 2000);
  }, []);

  return { unlock, playMention, playMessage, playAlert, playRing, stopRing };
}
