"use client";
import { useCallback, useRef } from "react";

export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  function getCtx(): AudioContext {
    if (!ctxRef.current) {
      ctxRef.current = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }

  function tone(ctx: AudioContext, freq: number, start: number, dur: number, vol: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(vol, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  // Two ascending pings — for @mentions or direct messages to you
  const playMention = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      tone(ctx, 880, t, 0.15, 0.3);
      tone(ctx, 1108, t + 0.18, 0.18, 0.25);
    } catch {
      // audio may be blocked in certain browser environments
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single soft pop — for messages in rooms you're not currently viewing
  const playMessage = useCallback(() => {
    try {
      const ctx = getCtx();
      tone(ctx, 523, ctx.currentTime, 0.12, 0.15);
    } catch {
      // audio may be blocked
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { playMention, playMessage };
}
