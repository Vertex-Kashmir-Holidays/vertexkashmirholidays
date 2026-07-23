import { GTMScript } from "@/components/providers/GTMScript";
import { NEXT_PUBLIC_GTM_ID } from "@/lib/env.public";

const rawGtmId = NEXT_PUBLIC_GTM_ID ?? "";
const GTM_ID = /^GTM-[A-Z0-9]+$/.test(rawGtmId) ? rawGtmId : null;

interface SiteAnalyticsProps {
  /** Present only on routes still using nonce-based CSP (/account, /login). */
  nonce?: string;
}

/**
 * GTM init script — gated on cookie consent (see GTMScript). Never render
 * this on /admin.
 *
 * No <noscript> GTM pixel here on purpose: that fallback would fire
 * unconditionally for JS-disabled visitors with no way to gate it on
 * consent, defeating the point of gating GTM at all. Cookie consent
 * inherently requires JS (the banner/preferences UI, the localStorage read),
 * so a visitor who can't run that also can't have GTM's noscript pixel
 * running on unconsented cookies.
 */
export function SiteAnalytics({ nonce }: SiteAnalyticsProps) {
  if (!GTM_ID) return null;

  return <GTMScript gtmId={GTM_ID} nonce={nonce} />;
}
