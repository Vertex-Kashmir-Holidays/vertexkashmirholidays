import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/** Full-page "no permission" state for an admin module. Renders instead of any
 * module data — callers must check `can()` and return this before querying. */
export function AccessDenied({ moduleLabel }: { moduleLabel: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-lg font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to access {moduleLabel}.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
