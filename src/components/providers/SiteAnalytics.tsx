import { GTMScript } from "@/components/providers/GTMScript";
import { NEXT_PUBLIC_GTM_ID } from "@/lib/env.public";

const rawGtmId = NEXT_PUBLIC_GTM_ID ?? "";
const GTM_ID = /^GTM-[A-Z0-9]+$/.test(rawGtmId) ? rawGtmId : null;

interface SiteAnalyticsProps {
  /** Present only on routes still using nonce-based CSP (/account, /login). */
  nonce?: string;
}

/** GTM noscript fallback + init script. Never render this on /admin. */
export function SiteAnalytics({ nonce }: SiteAnalyticsProps) {
  if (!GTM_ID) return null;

  return (
    <>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
      <GTMScript gtmId={GTM_ID} nonce={nonce} />
    </>
  );
}
