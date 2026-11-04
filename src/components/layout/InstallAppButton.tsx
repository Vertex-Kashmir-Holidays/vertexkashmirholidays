"use client";

import { useSyncExternalStore } from "react";
import { Download } from "lucide-react";

// Chrome/Edge/Samsung Internet fire `beforeinstallprompt` only when the site is
// installable AND not already installed, so "we hold a deferred prompt" is
// exactly the condition for showing the button. Safari/iOS and Firefox never
// fire it, so the button simply never renders there.
//
// The listener is attached at module load, not in an effect: the event can
// fire before React hydrates, and a late listener would miss it for the whole
// visit.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Stop Chrome's own mini-infobar; our button offers the prompt instead.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => deferredPrompt !== null;
const getServerSnapshot = () => false;

interface Props {
  className?: string;
  /** Show the "Install app" text next to the icon (mobile pill) vs icon only. */
  showLabel?: boolean;
}

export function InstallAppButton({ className, showLabel = false }: Props) {
  const canInstall = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!canInstall) return null;

  const install = async () => {
    const prompt = deferredPrompt;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    // A prompt can only be used once. If the visitor dismissed it, Chrome may
    // fire beforeinstallprompt again later, which brings the button back.
    deferredPrompt = null;
    notify();
  };

  return (
    <button
      type="button"
      onClick={install}
      aria-label="Install Vertex Kashmir app"
      title="Install app"
      className={className}
    >
      <Download className="h-4 w-4" strokeWidth={2} />
      {showLabel && <span>Install app</span>}
    </button>
  );
}
