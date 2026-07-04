"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { Logo } from "@/components/brand/Logo";

const STORAGE_KEY = "vkh_announcement_dismissed";
const OPEN_DELAY_MS = 1.5 * 60 * 1000;

export function AnnouncementModal() {
  const { showAnnouncementBanner, announcementMessage, whatsapp, sitePhone } =
    useSiteSettings();
  const buildWhatsApp = useWhatsAppLink();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showAnnouncementBanner) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let t: ReturnType<typeof setTimeout>;

    const schedule = () => {
      t = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }

    return () => {
      clearTimeout(t);
      window.removeEventListener("load", schedule);
    };
  }, [showAnnouncementBanner]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Focus the dialog on open so keyboard/AT users land inside it
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => closeRef.current?.focus(), 30);
    return () => clearTimeout(id);
  }, [open]);

  // Escape to close + Tab focus-trap
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { dismiss(); return; }

      if (e.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]),[href],[tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const contactNumber = whatsapp || sitePhone;
  const whatsappHref = contactNumber
    ? buildWhatsApp("Hi! I'd like to plan a Kashmir trip with Vertex Kashmir Holidays.")
    : null;

  const message =
    announcementMessage ||
    "Our website is live and our full tour catalogue is on the way. Our travel experts are ready right now to craft your perfect Kashmir escape — personalised, hassle-free, and unforgettable.";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Announcement"
        className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero banner — same cream/gold + navy scene as the brand placeholders (public/brand/placeholders), minus their baked-in wordmark text */}
        <div className="relative h-36 bg-gradient-to-b from-[#FBF6EA] to-[#F0E6CD] dark:from-[#0B1F3A] dark:to-[#0A1A2E] overflow-hidden">
          {/* Brand glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_35%,rgba(194,161,78,0.16),transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_70%_at_50%_35%,rgba(11,164,91,0.14),transparent_70%)]" />

          {/* Mountain silhouette layers */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 400 60"
            preserveAspectRatio="none"
          >
            <path
              d="M0 44 L48 34 L88 41 L136 30 L184 39 L232 28 L280 38 L328 30 L368 39 L400 33 L400 60 L0 60 Z"
              className="fill-[#E7DABB] dark:fill-[#16345C]"
              opacity={0.65}
            />
            <path
              d="M0 50 L40 43 L80 49 L120 41 L160 47 L200 38 L240 46 L288 40 L336 47 L376 42 L400 48 L400 60 L0 60 Z"
              className="fill-[#D8C49A] dark:fill-[#1E3E69]"
              opacity={0.9}
            />
          </svg>

          {/* Logo */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <Logo variant="auto" href="" />
          </div>

          {/* Close */}
          <button
            ref={closeRef}
            onClick={dismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/5 hover:bg-black/10 text-brand-navy dark:bg-white/15 dark:hover:bg-white/25 dark:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Wave emoji + headline */}
          <div className="absolute bottom-4 left-6">
            <h2 className="text-brand-navy dark:text-white font-extrabold text-xl leading-tight tracking-tight dark:drop-shadow">
              <span className="text-5xl mb-0.5">👋</span> Welcome to Kashmir!
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6 space-y-5">
          {/* Message */}
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {message}
          </p>

          {/* Social proof */}
          <div className="flex items-center gap-3 py-3 px-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl">
            <div className="text-2xl">🏔️</div>
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-100">
                Kashmir · Ladakh · Gulmarg · Pahalgam · Vaishno Devi
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Custom itineraries · Group & private tours · Honeymoon packages
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold py-3 px-5 rounded-2xl transition-all shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
              >
                {/* WhatsApp icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Plan My Trip
              </a>
            ) : null}
            <button
              onClick={dismiss}
              className="flex-1 text-sm font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 py-3 px-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Explore First
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
