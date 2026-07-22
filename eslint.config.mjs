// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

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
    rules: {
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
