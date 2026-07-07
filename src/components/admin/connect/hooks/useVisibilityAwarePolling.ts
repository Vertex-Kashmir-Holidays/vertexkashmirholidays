"use client";
import { useEffect, useRef } from "react";

/**
 * Runs `callback` immediately, then every `intervalMs` while the tab is
 * visible. While the tab is hidden, either polls at the slower
 * `hiddenIntervalMs` (if given — e.g. incoming-call detection, which should
 * keep working in the background, just less often) or pauses entirely (if
 * omitted — e.g. a presence heartbeat, which has nothing useful to report
 * while unfocused). Either way, the moment the tab becomes visible again the
 * normal interval resumes and `callback` fires immediately to catch up.
 */
export function useVisibilityAwarePolling(
  callback: () => void,
  intervalMs: number,
  hiddenIntervalMs?: number,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;

    function schedule(ms: number | null) {
      if (id) clearInterval(id);
      id = ms ? setInterval(() => callbackRef.current(), ms) : null;
    }

    function apply() {
      schedule(document.hidden ? hiddenIntervalMs ?? null : intervalMs);
    }

    function onVisibilityChange() {
      apply();
      if (!document.hidden) callbackRef.current(); // catch up immediately on refocus
    }

    callbackRef.current();
    apply();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, hiddenIntervalMs]);
}
