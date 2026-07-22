import type { Preview } from "@storybook/nextjs-vite";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { initialize, mswLoader } from "msw-storybook-addon";
import { ThemeProvider } from "../src/components/providers/ThemeProvider";
import { TooltipProvider } from "../src/components/ui/atoms/tooltip";
import { mswHandlers } from "./msw-handlers";
import "../src/app/globals.css";

// MSW intercepts any story's real fetch("/api/...") calls — see msw-handlers.ts.
// onUnhandledRequest "bypass" so requests to unmocked endpoints (none of the
// current stories need any) just pass through instead of erroring in the console.
initialize({ onUnhandledRequest: "bypass" });

// Drives the REAL next-themes ThemeProvider (src/components/providers/ThemeProvider.tsx
// — the same one (public)/layout.tsx and admin/layout.tsx mount) from Storybook's own
// theme toolbar below, so components that call next-themes' useTheme() (e.g.
// ThemeToggle) actually work in a story instead of only being visually reskinned.
function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  // Deliberately depend on `theme` only: next-themes' `setTheme` isn't a
  // stable reference across renders, so including it here re-fires this
  // effect on every render (including the one a click causes) and stomps
  // the user's own toggle straight back to the Storybook toolbar's value.
  useEffect(() => {
    setTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
  return null;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    // Default handlers for any story that fetches — override per-story via
    // `parameters: { msw: { handlers: mswHandlers.galleriesError } }` etc.
    msw: { handlers: mswHandlers.galleries },
  },

  loaders: [mswLoader],

  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: "light",
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";
      return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ThemeSync theme={theme} />
          <TooltipProvider delayDuration={200}>
            <div className="bg-background p-8 text-foreground">
              <Story />
            </div>
          </TooltipProvider>
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
