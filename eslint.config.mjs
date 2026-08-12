import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/*
 * eslint-config-next 16 ships native flat configs, so this imports them
 * directly. The previous FlatCompat bridge (via @eslint/eslintrc) is gone —
 * it crashed under ESLint 10 with "Converting circular structure to JSON".
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Unused args are fine when prefixed with _ (event handlers, catch params).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
  {
    // The service worker is plain JS running in a worker scope, not app code.
    files: ["public/sw.js", "scripts/**/*.mjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default config;
