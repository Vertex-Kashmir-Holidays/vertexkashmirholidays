// src/components/blog/BlogPostQuickAnswer.tsx

import sanitizeHtml from "sanitize-html";

interface BlogPostQuickAnswerProps {
  html: string | null;
}

// Same allowlist philosophy as BlogPostBody, trimmed to what a one-paragraph
// direct-answer callout actually needs.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "a", "strong", "b", "em", "i", "br", "ul", "ol", "li"],
  allowedAttributes: { a: ["href", "name", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, false),
  },
};

export function BlogPostQuickAnswer({ html }: BlogPostQuickAnswerProps) {
  if (!html) return null;
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);
  if (!clean.trim()) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="text-[15px] font-bold text-foreground">Quick Answer</h2>
      <div
        className="mt-2 text-[14px] leading-relaxed text-foreground/80 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}
