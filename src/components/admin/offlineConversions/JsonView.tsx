// Lightweight, dependency-free JSON syntax highlighting (regex-based token
// coloring) — avoids pulling in a syntax-highlighter package for one
// read-only debug view. Input is always HTML-escaped before any styling is
// applied, so this is safe against data that happens to contain HTML-like
// characters (e.g. an error message echoing back user input).

function escapeHtml(raw: string): string {
  return raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TOKEN_RE = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

function highlight(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(TOKEN_RE, (match) => {
    if (/^"/.test(match)) {
      const isKey = /:\s*$/.test(match);
      return `<span class="${isKey ? "text-sky-600 dark:text-sky-400 font-semibold" : "text-emerald-600 dark:text-emerald-400"}">${match}</span>`;
    }
    if (match === "true" || match === "false") {
      return `<span class="text-purple-600 dark:text-purple-400">${match}</span>`;
    }
    if (match === "null") {
      return `<span class="text-muted-foreground">${match}</span>`;
    }
    return `<span class="text-amber-600 dark:text-amber-400">${match}</span>`;
  });
}

interface Props {
  value: unknown;
  className?: string;
}

/** Read-only, pretty-printed, lightly syntax-highlighted JSON block. */
export function JsonView({ value, className }: Props) {
  const json = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <pre
      className={`text-[11px] font-mono bg-muted rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: highlight(json) }}
    />
  );
}
