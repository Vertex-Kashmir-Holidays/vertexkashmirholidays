// src/components/contact/ContactWhatsAppFloat.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { WhatsAppIcon } from "@/components/icons/brand";
import { trackWhatsappClick } from "@/lib/analytics";
import { appendWhatsAppAttributionTag } from "@/lib/whatsapp";
import { useWhatsAppAttributionTag } from "@/lib/useWhatsAppAttributionTag";

interface ContactWhatsAppFloatProps {
  text: string;
  href: string;
}

export function ContactWhatsAppFloat({ text, href }: ContactWhatsAppFloatProps) {
  // `href` is computed server-side (see (public)/contact/page.tsx) and can't
  // see the browser's attribution cookie — append the reference tag here,
  // client-side, same as useWhatsAppLink() does for every other WhatsApp CTA.
  // useWhatsAppAttributionTag() correctly returns undefined during
  // SSR/hydration (matching the server-rendered href) and the real tag once
  // ready, on a client-only re-render after.
  const tag = useWhatsAppAttributionTag();
  const waHref = appendWhatsAppAttributionTag(href, tag);
  return (
    <Link
      href={waHref}
      target="_blank"
      onClick={() => trackWhatsappClick("float")}
      rel="noopener noreferrer"
      className="fixed bottom-24 right-5 z-50 flex items-center gap-3 lg:bottom-6"
      aria-label="Chat with us on WhatsApp"
    >
      <span className="rounded-full bg-card px-4 py-2 text-[14px] font-semibold text-foreground shadow-card">
        {text}
      </span>
      <motion.span
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-card transition hover:scale-105"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <WhatsAppIcon className="h-7 w-7" />
      </motion.span>
    </Link>
  );
}
