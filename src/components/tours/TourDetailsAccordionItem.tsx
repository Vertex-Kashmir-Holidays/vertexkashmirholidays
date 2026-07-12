// src/components/sections/TourDetailsAccordionItem.tsx
//
// Native <details>/<summary> — no client JS. Collapsed by default via CSS only,
// so content stays in the server-rendered HTML (crawlable, no lazy-load) while
// the browser handles show/hide natively.

interface TourDetailsAccordionItemProps {
  title: string;
  children: React.ReactNode;
}

export function TourDetailsAccordionItem({ title, children }: TourDetailsAccordionItemProps) {
  return (
    <details className="group rounded-xl border border-border bg-muted/40 open:bg-muted/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-[14px] font-bold text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="px-4 pb-4 text-[14px] leading-relaxed text-foreground/80">{children}</div>
    </details>
  );
}
