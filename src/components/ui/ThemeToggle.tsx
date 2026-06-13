'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes can only resolve the active theme on the client; wait for mount
  // to avoid a hydration mismatch between server and client markup.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      // aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      // title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`grid h-9 w-9 place-items-center rounded-full border border-foreground/20 text-foreground transition hover:bg-foreground/10 ${className}`}
    >
      {/* Render a neutral icon until mounted to keep SSR/CSR markup stable */}
      {!mounted ? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
        </svg>
      ) : isDark ? (
        // Sun — click to go light
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon — click to go dark
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
