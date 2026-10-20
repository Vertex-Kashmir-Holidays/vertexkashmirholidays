import { Download, FolderOpen } from "lucide-react";
import { docDownloadFilename } from "@/lib/docs/categories";

export interface AgencyDocItem {
  id: string;
  title: string;
  description: string;
  category: string;
  mimeType: string;
}

// Read-only — B2B agents can view and download, not upload or delete.
// Uploads are admin-only via /admin/docs (src/components/admin/docs/DocsClient.tsx).
export function AgencyDocsCard({ docs }: { docs: AgencyDocItem[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display font-bold text-foreground">Documents</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Rates, policies, and reference material shared by Vertex Kashmir Holidays.
      </p>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
          <FolderOpen className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-[12px] text-muted-foreground">No documents shared yet.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {docs.map((doc) => (
            <li key={doc.id}>
              <a
                href={`/api/docs/${doc.id}/download`}
                download={docDownloadFilename(doc.title, doc.mimeType)}
                className="flex items-start gap-3 rounded-xl border border-border px-3 py-2.5 transition hover:border-primary/40 hover:bg-primary/5"
              >
                {/* Full title (wrapped, never cut off) + what it's for —
                    agents choose by purpose, not by file name. */}
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-foreground">{doc.title}</p>
                  {doc.description && (
                    <p className="mt-0.5 break-words text-[12px] leading-snug text-muted-foreground">
                      {doc.description}
                    </p>
                  )}
                </div>
                <Download className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
