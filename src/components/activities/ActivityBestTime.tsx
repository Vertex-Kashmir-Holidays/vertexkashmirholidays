// src/components/activities/ActivityBestTime.tsx
import sanitizeHtml from "sanitize-html";

interface ActivityBestTimeProps {
  html: string | null;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "a", "strong", "b", "em", "i", "br", "ul", "ol", "li"],
  allowedAttributes: { a: ["href", "name", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, false),
  },
};

export function ActivityBestTime({ html }: ActivityBestTimeProps) {
  if (!html) return null;
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);
  if (!clean.trim()) return null;

  return (
    <section
      id="best-time"
      className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft"
    >
      <h2 className="text-[18px] font-bold">Best Time</h2>
      <div
        className="mt-3 text-[14px] leading-relaxed text-foreground/75 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </section>
  );
}
