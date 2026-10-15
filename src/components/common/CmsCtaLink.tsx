"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";
import { isWhatsAppCtaUrl, getWhatsAppCtaMessage } from "@/lib/whatsappCtaUrl";
import type { WhatsAppSource } from "@/types/analytics";

interface CmsCtaLinkProps {
  /** Admin-entered CTA link: a path, an http(s) URL, or "whatsapp:<message>". */
  href: string;
  /** whatsapp_click source, sent only when the link is a WhatsApp CTA. */
  source: WhatsAppSource;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

// Every CMS-authored CTA link goes through here. A "whatsapp:<message>" link
// (same encoding as Banner CTAs, see whatsappCtaUrl.ts) opens WhatsApp with
// the live number + attribution tag — rendered as a plain <Link> it would be
// treated as a relative path and 404. http(s) links open in a new tab;
// anything else is an internal <Link>.
export function CmsCtaLink({ href, source, className, style, children }: CmsCtaLinkProps) {
  const wa = useWhatsAppLink();

  if (isWhatsAppCtaUrl(href)) {
    return (
      <a
        href={wa(getWhatsAppCtaMessage(href))}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWhatsappClick(source)}
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }

  const isExternal = /^https?:\/\//.test(href);
  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
}
