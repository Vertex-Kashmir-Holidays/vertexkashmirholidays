/**
 * Build a WhatsApp click-to-chat URL from a phone number + optional prefilled
 * message. Strips everything but digits (wa.me needs the full intl number with
 * no +/spaces). Falls back to the contact page when no number is configured.
 */
export function buildWhatsAppHref(number?: string | null, message?: string): string {
  const digits = (number ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "/contact";
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

/**
 * Appends a WhatsApp attribution reference (e.g. "[Ref: G-CgVI13IE]") to an
 * existing wa.me href's prefilled message. `tag` is a plain parameter, not
 * read from the cookie internally — this function is now a pure string
 * transform with no browser API dependency, so it can never itself cause a
 * hydration mismatch. Callers get the tag from useWhatsAppAttributionTag()
 * (src/lib/useWhatsAppAttributionTag.ts), which correctly returns undefined
 * during SSR/hydration and only the real value on a client-only re-render
 * after — see that hook's doc comment for why that split matters here.
 *
 * Returns the href completely unchanged when `tag` is undefined (no
 * attribution captured yet, consent not granted, or mid-hydration) or the
 * href isn't a wa.me link this function knows how to extend (e.g. the
 * "/contact" or "#" fallbacks) — the existing message and behaviour are only
 * ever extended, never replaced.
 *
 * Deliberately avoids URL/URLSearchParams for reassembly: their `.toString()`
 * serializes as application/x-www-form-urlencoded (spaces -> "+", stricter
 * percent-encoding), which does NOT match buildWhatsAppHref's
 * encodeURIComponent output above (spaces -> "%20") — mixing the two styles
 * on different renders of the same href is exactly what produced a real
 * hydration-mismatch warning during testing. Every "text" param in this
 * codebase is the last/only query param (see buildWhatsAppHref, Footer.tsx's
 * local wa(), and the contact page's waLink()), so simple slicing is safe.
 */
export function appendWhatsAppAttributionTag(href: string, tag: string | undefined): string {
  if (!tag) return href;
  if (!href.startsWith("https://wa.me/")) return href;

  const suffix = `[Ref: ${tag}]`;
  const marker = "?text=";
  const idx = href.indexOf(marker);

  if (idx === -1) {
    return `${href}${marker}${encodeURIComponent(suffix)}`;
  }

  const existingText = decodeURIComponent(href.slice(idx + marker.length));
  const newText = `${existingText}\n\n${suffix}`;
  return `${href.slice(0, idx + marker.length)}${encodeURIComponent(newText)}`;
}
