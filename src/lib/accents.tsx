import { Fragment, type ReactNode } from "react";

// Renders DB-driven headings that use accent markers:
//   *text* → warm gradient italic, ~text~ → cool gradient italic, \n → line break
export function renderAccents(text: string | null): ReactNode {
  if (!text) return null;
  return text.split("\n").map((line, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {line.split(/(\*[^*]+\*|~[^~]+~)/g).map((part, pi) => {
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return (
            <span key={pi} className="grad-text-warm italic">
              {part.slice(1, -1)}
            </span>
          );
        }
        if (part.length > 2 && part.startsWith("~") && part.endsWith("~")) {
          return (
            <span key={pi} className="grad-text-cool italic">
              {part.slice(1, -1)}
            </span>
          );
        }
        return <Fragment key={pi}>{part}</Fragment>;
      })}
    </Fragment>
  ));
}

// Renders About-page headings: *text* → mint highlight, \n → line break.
export function renderMint(text: string | null): ReactNode {
  if (!text) return null;
  return text.split("\n").map((line, li) => (
    <Fragment key={li}>
      {li > 0 && <br />}
      {line.split(/(\*[^*]+\*)/g).map((part, pi) => {
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return (
            <span key={pi} className="text-brand-mint">
              {part.slice(1, -1)}
            </span>
          );
        }
        return <Fragment key={pi}>{part}</Fragment>;
      })}
    </Fragment>
  ));
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
