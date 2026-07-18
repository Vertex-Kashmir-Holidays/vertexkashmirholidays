import sanitizeHtml from "sanitize-html";

// TripAdvisor's free self-serve widget embed is a static <div>/<ul>/<li> block
// (their own logo/branding markup) plus an async <script src="...jscache.com/wejs?...">
// that TripAdvisor's own JS uses to locate and hydrate the container by DOM id.
// A <script> tag inside dangerouslySetInnerHTML never executes (browsers don't
// run scripts inserted via innerHTML), so this is parsed into two parts: the
// static markup (sanitized, rendered via dangerouslySetInnerHTML) and the
// script src (executed separately via a real <script> element — see
// src/components/reviews/TripadvisorWidget.tsx).
const SCRIPT_TAG = /<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>\s*<\/script>/i;

// Deliberately allows `id` — TripAdvisor's script locates its container by DOM
// id, and this value is staff-entered admin content (Settings), same trust
// level as the blog-body/campaign HTML already sanitized via src/lib/sanitize.ts.
const WIDGET_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["div", "ul", "li", "a", "img", "span", "noscript"],
  allowedAttributes: {
    "*": ["id", "class", "style"],
    a: ["id", "class", "style", "href", "target", "rel"],
    img: ["id", "class", "style", "src", "alt", "width", "height"],
  },
  allowedSchemes: ["http", "https"],
};

export interface ParsedTripadvisorWidget {
  html: string;
  scriptSrc: string;
}

// TripAdvisor's snippet is HTML source, so its src="...&amp;uniq=..." attribute
// is HTML-entity-encoded (correct for HTML parsing). But the regex above reads
// the raw string directly, and script.src is later assigned as a plain JS
// string (not parsed as HTML) — so without decoding, the browser would request
// a URL containing the literal text "&amp;" instead of "&", mangling every
// query param after the first (locationId, uniq, etc.) and breaking the widget.
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'");
}

/** Extracts the widget's script src and sanitizes the remaining static markup. Returns null if no script tag is found (nothing to render). */
export function parseTripadvisorWidget(
  raw: string | null | undefined,
): ParsedTripadvisorWidget | null {
  if (!raw) return null;
  const match = raw.match(SCRIPT_TAG);
  if (!match) return null;

  const scriptSrc = decodeHtmlEntities(match[1]);
  const markup = raw.slice(0, match.index) + raw.slice(match.index! + match[0].length);
  const html = sanitizeHtml(markup, WIDGET_OPTIONS).trim();
  if (!html) return null;

  return { html, scriptSrc };
}
