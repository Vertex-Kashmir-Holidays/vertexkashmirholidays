// src/components/blog/BlogPostBody.tsx

import sanitizeHtml from "sanitize-html";

// Renders a blog post's stored HTML body with theme-aware, prose-like styling.
// (The project has no @tailwindcss/typography, so styles are hand-rolled via
// arbitrary child selectors.)
interface BlogPostBodyProps {
  html: string;
}

// Allow the formatting tags the editor produces (headings, lists, links,
// images, blockquotes, basic inline marks) — everything else (script, style,
// event handlers, javascript: URLs) is stripped. Runs server-side via
// htmlparser2 (no jsdom), so it works under Turbopack/RSC.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
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
  // Force safe link behaviour for any target=_blank links.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, false),
  },
};

export function BlogPostBody({ html }: BlogPostBodyProps) {
  // Admin-authored HTML is sanitized before injection so a stored <script>,
  // onerror=, javascript: URL, etc. can never execute in a visitor's browser.
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);
  return (
    <div
      className="
        max-w-none text-[15px] leading-[1.8] text-foreground/85
        [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-28 [&_h2]:font-display [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:text-foreground
        [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-[18px] [&_h3]:font-bold [&_h3]:text-foreground
        [&_p]:my-4
        [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
        [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
        [&_li]:text-foreground/85 [&_li]:marker:text-primary
        [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline
        [&_strong]:font-bold [&_strong]:text-foreground
        [&_img]:my-6 [&_img]:rounded-xl
        [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
      "
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
