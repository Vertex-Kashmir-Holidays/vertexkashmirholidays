"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useWhatsAppLink } from "@/components/providers/SiteSettingsProvider";
import { trackWhatsappClick } from "@/lib/analytics";
import type { WhatsAppSource } from "@/types/analytics";

// For admin-authored HTML (rendered via dangerouslySetInnerHTML), where a
// WhatsApp link can't be a <CmsCtaLink>. The sanitizer marks wa.me links with
// data-wa-message; after hydration this rebuilds each one the CmsCtaLink way —
// live site number + attribution tag — and tracks clicks. Without JS the
// stored link still works as written.
export function WhatsAppLinkScope({
  source,
  defaultMessage,
  children,
}: {
  source: WhatsAppSource;
  /** Used when the stored link has no ?text= message. */
  defaultMessage: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wa = useWhatsAppLink();

  useEffect(() => {
    const links = Array.from(
      ref.current?.querySelectorAll<HTMLAnchorElement>("a[data-wa-message]") ?? [],
    );
    const onClick = () => trackWhatsappClick(source);
    for (const a of links) {
      a.href = wa(a.dataset.waMessage || defaultMessage);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.addEventListener("click", onClick);
    }
    return () => links.forEach((a) => a.removeEventListener("click", onClick));
  }, [wa, source, defaultMessage]);

  return <div ref={ref}>{children}</div>;
}
