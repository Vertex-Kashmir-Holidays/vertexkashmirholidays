// src/components/activities/ActivityWhyExperience.tsx
import sanitizeHtml from 'sanitize-html';

interface ActivityWhyExperienceProps {
  name: string;
  html: string | null;
  /** When true, renders without its own card wrapper — for composing inside a shared card. */
  bare?: boolean;
}

// Same sanitize allowlist/idiom as the Destination detail HTML cards.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'a', 'strong', 'b', 'em', 'i', 'br', 'ul', 'ol', 'li'],
  allowedAttributes: { a: ['href', 'name', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, false),
  },
};

export function ActivityWhyExperience({ name, html, bare }: ActivityWhyExperienceProps) {
  if (!html) return null;
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);
  if (!clean.trim()) return null;

  const body = (
    <>
      <h2 className="text-[18px] font-bold">Why Experience {name}</h2>
      <div
        className="mt-3 text-[14px] leading-relaxed text-foreground/75 [&_a]:font-semibold [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_strong]:font-bold [&_strong]:text-foreground [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </>
  );

  if (bare) return <div id="why-experience">{body}</div>;

  return (
    <section id="why-experience" className="rounded-2xl border border-border bg-card p-3 sm:p-6 shadow-soft">
      {body}
    </section>
  );
}
