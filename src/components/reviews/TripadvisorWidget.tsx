"use client";

import { useEffect, useId, useRef } from "react";
import type { ParsedTripadvisorWidget } from "@/lib/reviews/tripadvisorWidget";

// Renders TripAdvisor's static widget markup, then executes their loader
// script the same way SiteAnalytics/GTMScript does for GTM on this same
// (public, static-CSP) route group: a real <script> element created via
// document.createElement, not the inert <script> tag TripAdvisor's snippet
// ships (a script inside dangerouslySetInnerHTML never runs). No nonce is
// needed here — /reviews is a public page under the static CSP (see
// src/proxy.ts), so the script is trusted via the script-src host allowlist
// (www.jscache.com) rather than a per-request nonce.
//
// Two instances of this component render on /reviews (hero + stats row), each
// with a different widget, so the script id must be unique per instance —
// a shared id would let the second mount tear down the first's script.
//
// Lazy-loaded via IntersectionObserver: the script only fetches/executes once
// its container actually scrolls into view, so the below-the-fold instance
// doesn't cost anything on initial page load.
//
// `hasInjected` guards against React dev-mode Strict Mode's intentional
// mount->cleanup->mount cycle: TripAdvisor's script chains 2-3 hops, and each
// hop's inline code synchronously creates the NEXT hop's <script> the moment
// it runs — our cleanup can only remove the one script element we tracked by
// id, not the untracked follow-up script it already spawned. Without this
// guard, Strict Mode's double effect could start two competing hydration
// chains against the same container, which is the likely cause of the widget
// sometimes rendering and sometimes not on reload.
export function TripadvisorWidget({ widget }: { widget: ParsedTripadvisorWidget }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptId = `tripadvisor-widget-loader-${useId()}`;
  const hasInjected = useRef(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const inject = () => {
      if (hasInjected.current) return;
      hasInjected.current = true;
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = widget.scriptSrc;
      document.body.appendChild(script);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          inject();
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, [widget.scriptSrc, scriptId]);

  return (
    // The fixed-height, overflow-hidden frame lives on the wrapper the caller
    // provides (see the hero/stats-row usage) — not here — because clipping
    // needs to happen outside this DOM subtree entirely: any CSS applied
    // inside it fights TripAdvisor's own styling of these exact elements
    // once their script hydrates (that's what caused the off-center icon).
    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: widget.html }} />
  );
}
