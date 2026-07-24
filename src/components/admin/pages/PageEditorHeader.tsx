import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function PageEditorHeader({
  title,
  publicHref,
  readOnly,
}: {
  title: string;
  publicHref?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-extrabold text-foreground">{title}</h2>
        {readOnly && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            You have read-only access to this page.
          </p>
        )}
      </div>
      {publicHref && (
        <Link
          href={publicHref}
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          View live <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
