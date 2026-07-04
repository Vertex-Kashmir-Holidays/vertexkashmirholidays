"use client";
import { useEffect } from "react";

// Forces an instant (non-smooth) scroll to top on mount. Needed on pages with
// heavy Framer Motion layout/layoutId animations (e.g. tab underline
// indicators): the global `scroll-behavior: smooth` means Next's own
// navigation scroll-reset is a gradual animation, and Framer Motion's layout
// measurement can capture that mid-flight scrollY and "restore" it on every
// subsequent layout pass — freezing the page part-way down instead of at the
// top. An instant jump here removes the vulnerable mid-animation window
// entirely, so any later Framer Motion measurement just sees (and restores) 0.
export function ScrollToTopOnMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  return null;
}
