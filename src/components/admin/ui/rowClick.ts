import type { MouseEvent } from "react";

/**
 * Click handler for a whole list row / mobile card: runs `open` unless the
 * click was on something interactive inside the row (its own links, buttons,
 * inputs) or the user was selecting text — those keep their own behaviour.
 * Keyboard users still reach the row's own links/buttons as before.
 */
export function rowClick(open: () => void) {
  return (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("a, button, input, select, textarea, label, [role='button']"))
      return;
    if (window.getSelection()?.toString()) return;
    open();
  };
}
