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

// The markup is sanitized, but the extracted script src is executed as a real
// <script> (see TripadvisorWidget.tsx) — so it is the one part of this
// staff-entered value that must be validated against a host allowlist rather
// than merely sanitized. Without this, a compromised Settings account could
// point the embed at an arbitrary script host.
//
// This list is deliberately the same set of TripAdvisor hosts allowed by
// script-src in src/proxy.ts — a src outside it would be blocked by CSP at
// runtime anyway, so keep the two in sync when either changes.
const ALLOWED_SCRIPT_HOSTS = new Set([
  "www.jscache.com",
  "www.tripadvisor.com",
  "www.tripadvisor.in",
  "static.tacdn.com",
]);

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

// Resolves the raw src to an absolute https URL on an allowlisted host, or
// null if it isn't one. Protocol-relative ("//www.jscache.com/wejs?...") is
// accepted because TripAdvisor's own snippets have shipped that form; the
// returned value is always absolute so the injected script.src is unambiguous.
function resolveAllowedScriptSrc(src: string): string | null {
  const trimmed = src.trim();
  // Only absolute or protocol-relative srcs are meaningful here. Resolving a
  // path-relative one against an allowlisted base would silently "pass" the
  // host check for a URL the embed never actually named.
  const absolute = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  let url: URL;
  try {
    url = new URL(absolute);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!ALLOWED_SCRIPT_HOSTS.has(url.hostname.toLowerCase())) return null;
  return url.toString();
}

/** Extracts the widget's script src and sanitizes the remaining static markup. Returns null if no script tag is found, its src is not an allowlisted TripAdvisor host, or nothing renderable remains. */
export function parseTripadvisorWidget(
  raw: string | null | undefined,
): ParsedTripadvisorWidget | null {
  if (!raw) return null;
  const match = raw.match(SCRIPT_TAG);
  if (!match) return null;

  const scriptSrc = resolveAllowedScriptSrc(decodeHtmlEntities(match[1]));
  if (!scriptSrc) return null;

  const markup = raw.slice(0, match.index) + raw.slice(match.index! + match[0].length);
  const html = sanitizeHtml(markup, WIDGET_OPTIONS).trim();
  if (!html) return null;

  return { html, scriptSrc };
}
