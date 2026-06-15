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
        <h2 className="font-display text-xl font-extrabold text-brand-navy">{title}</h2>
        {readOnly && <p className="text-xs text-amber-600">You have read-only access to this page.</p>}
      </div>
      {publicHref && (
        <Link
          href={publicHref}
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          View live <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
