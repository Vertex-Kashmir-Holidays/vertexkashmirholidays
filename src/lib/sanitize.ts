import sanitizeHtml from "sanitize-html";

// Inline HTML — campaign section headings, press logo names, etc.
// Allows formatting tags only; strips scripts, event handlers, javascript: URLs.
const INLINE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["em", "strong", "b", "i", "u", "s", "br", "span"],
  allowedAttributes: { "*": ["class"] },
  allowedSchemes: [],
};

// Rich HTML — blog body, long-form CMS content.
// Same as BlogPostBody's SANITIZE_OPTIONS.
const RICH_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "a", "ul", "ol", "li", "blockquote", "br", "hr", "span", "div",
    "strong", "b", "em", "i", "u", "s", "code", "pre",
    "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, false),
  },
};

// Press logo HTML — may contain inline SVGs.
// Allows SVG elements and presentation attributes; strips scripts and event handlers.
const PRESS_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // SVG structural
    "svg", "g", "defs", "symbol", "use", "clipPath", "mask",
    "linearGradient", "radialGradient", "stop",
    // SVG shapes
    "path", "circle", "ellipse", "rect", "line", "polyline", "polygon",
    // SVG text
    "text", "tspan",
    // HTML fallback (e.g. plain text names, <img> logo)
    "img", "em", "strong", "b", "i", "br", "span",
  ],
  allowedAttributes: {
    svg: ["xmlns", "viewBox", "width", "height", "fill", "stroke", "aria-hidden", "aria-label", "role", "class", "style"],
    path: ["d", "fill", "stroke", "stroke-width", "fill-rule", "clip-rule", "transform"],
    g: ["fill", "stroke", "transform", "class", "style"],
    circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width", "transform"],
    ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke", "transform"],
    rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke"],
    line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width"],
    polyline: ["points", "fill", "stroke", "stroke-width"],
    polygon: ["points", "fill", "stroke", "stroke-width"],
    stop: ["offset", "stop-color", "stop-opacity"],
    linearGradient: ["id", "x1", "y1", "x2", "y2", "gradientUnits"],
    radialGradient: ["id", "cx", "cy", "r", "fx", "fy", "gradientUnits"],
    text: ["x", "y", "dy", "text-anchor", "font-size", "fill", "transform"],
    tspan: ["x", "y", "dy", "dx"],
    clipPath: ["id"],
    mask: ["id"],
    // No href on <use> — prevents loading external SVG fragments
    img: ["src", "alt", "width", "height", "loading", "class", "style"],
    "*": ["class", "style"],
  },
  allowedSchemes: ["http", "https"],
};

/** Strip scripts/event-handlers from short inline HTML (headings, titles). */
export function sanitizeInlineHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, INLINE_OPTIONS);
}

/** Strip scripts/event-handlers from rich long-form HTML (blog body). */
export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, RICH_OPTIONS);
}

/** Strip scripts/event-handlers from press logo HTML (may include inline SVGs). */
export function sanitizePressHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, PRESS_OPTIONS);
}

/**
 * Serialize an object to a JSON string safe for injection inside
 * <script type="application/ld+json">. The only change vs JSON.stringify is
 * that `</` is escaped to `<\/` so a value containing "</script>" cannot
 * prematurely close the script tag. JSON parsers treat the two forms as
 * identical, so this has zero effect on SEO or structured-data consumers.
 */
export function safeLdJson(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/<\//g, "<\\/");
}
