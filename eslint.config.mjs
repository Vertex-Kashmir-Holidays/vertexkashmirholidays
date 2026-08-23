// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

import iconOnlyControlNeedsLabel from "./eslint-rules/icon-only-control-needs-label.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // `next lint` used to apply these ignores automatically; Next.js 16
    // removed that command, so running ESLint directly (`yarn lint`) needs
    // them declared explicitly or it lints build output.
    ignores: ["**/node_modules/**", "**/.next/**", "**/out/**", "**/build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      vertex: { rules: { "icon-only-control-needs-label": iconOnlyControlNeedsLabel } },
    },
    rules: {
      // Icons here are custom components, which jsx-a11y's
      // `control-has-associated-label` deliberately skips — this rule covers
      // the icon-only button/link case that would otherwise go unchecked.
      "vertex/icon-only-control-needs-label": "error",
      // `next/core-web-vitals` already maps this rule onto `next/image`
      // (`img: ["Image"]`) but only at "warn", which does not fail the build —
      // so alt coverage silently regressed. Same options, raised to error.
      // The rule checks that `alt` is *present*; `alt=""` remains the correct,
      // explicit marking for a decorative image.
      "jsx-a11y/alt-text": ["error", { elements: ["img"], img: ["Image"] }],
      // The codebase uses `style={{ '--x': … } as any}` for CSS custom
      // properties and copy with raw quotes throughout; keep these visible
      // as warnings without failing the production build.
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      // Established codebase convention (~50 existing call sites) for
      // intentionally-unused parameters, e.g. `(_req: NextRequest)`.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  ...storybook.configs["flat/recommended"],
];

export default eslintConfig;
