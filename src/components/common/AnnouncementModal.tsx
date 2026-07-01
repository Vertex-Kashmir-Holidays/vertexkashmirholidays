"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Phone } from "lucide-react";
import { useSiteSettings, useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";

const STORAGE_KEY = "vkh_announcement_dismissed";

export function AnnouncementModal() {
  const { showAnnouncementBanner, announcementMessage, whatsapp, sitePhone } =
    useSiteSettings();
  const buildWhatsApp = useWhatsAppLink();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!showAnnouncementBanner) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let t: ReturnType<typeof setTimeout>;

    const schedule = () => {
      t = setTimeout(() => setOpen(true), 3_000);
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

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const contactNumber = whatsapp || sitePhone;
  const whatsappHref = contactNumber
    ? buildWhatsApp("Hi! I'd like to enquire about your Kashmir tour packages.")
    : null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient band */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-7 pt-6 pb-7 space-y-4">
          {/* Icon + heading */}
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                Vertex Kashmir Holidays
              </p>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight">
                Welcome!
              </h2>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {announcementMessage ||
              "We're currently uploading our full tour catalogue. New packages are being added regularly. Reach out to us for a custom itinerary tailored just for you — we'd love to plan your perfect Kashmir escape."}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
              >
                <Phone className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            )}
            <button
              onClick={dismiss}
              className="flex-1 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Browse Site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
